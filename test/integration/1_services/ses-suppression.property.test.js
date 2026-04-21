/* eslint-disable func-names */
const should = require('should');
const sinon = require('sinon');
const fc = require('fast-check');
const SesSuppressionService = require('../../../api/services/SesSuppressionService');
const { awsSesCli } = require('../../../config/awsSes');

// --- Shared arbitraries ---

// Simple email-like string for testing
const emailArb = fc
  .tuple(
    fc.stringMatching(/^[a-z0-9]{1,8}$/),
    fc.stringMatching(/^[a-z0-9]{1,6}$/)
  )
  .map(([local, domain]) => `${local}@${domain}.test`);

/**
 * Feature: ses-suppression-polling
 * Property 2: Pagination collects all suppressed destinations
 *
 * For any sequence of paginated SES API responses (1 to N pages, each
 * containing 0 or more suppressed destinations, with NextToken linking pages),
 * fetchSuppressedEmails returns an array containing every email address from
 * every page, with no duplicates lost and no extras added.
 *
 * Validates: Requirements 2.2
 */
describe('SesSuppressionService - Property 2: Pagination collects all suppressed destinations', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('should collect all emails across all paginated pages', function () {
    this.timeout(30000);

    // Generate a list of pages, each page is an array of emails
    const pagesArb = fc.array(fc.array(emailArb, { maxLength: 5 }), {
      minLength: 1,
      maxLength: 5,
    });

    fc.assert(
      fc.asyncProperty(pagesArb, async (pages) => {
        sinon.restore();

        // Build the stubbed responses for each page
        const responses = pages.map((pageEmails, idx) => ({
          SuppressedDestinationSummaries: pageEmails.map((email) => ({
            EmailAddress: email,
            Reason: 'BOUNCE',
            LastUpdateTime: new Date(),
          })),
          NextToken: idx < pages.length - 1 ? `token-${idx + 1}` : undefined,
        }));

        const sendStub = sinon.stub(awsSesCli, 'send');
        responses.forEach((resp, idx) => {
          sendStub.onCall(idx).resolves(resp);
        });

        const result = await SesSuppressionService.fetchSuppressedEmails();

        // Collect all expected emails (lowercased)
        const expectedEmails = pages.flat().map((e) => e.toLowerCase());

        should(result).have.length(expectedEmails.length);
        should(result.sort()).deepEqual(expectedEmails.sort());
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: ses-suppression-polling
 * Property 3: Suppressed email matching marks correct cavers
 *
 * For any set of suppressed email addresses and any set of caver records with
 * mail_is_valid = true, after calling markCaversAsInvalid, exactly those cavers
 * whose email (case-insensitive) appears in the suppressed list have
 * mail_is_valid = false, and all other cavers remain unchanged.
 *
 * Validates: Requirements 3.1, 3.2, 3.4
 */
describe('SesSuppressionService - Property 3: Suppressed email matching marks correct cavers', () => {
  it('should mark exactly the matching cavers as invalid', async function () {
    this.timeout(120000);

    // Use unique emails to avoid collisions with fixture cavers
    const testEmailArb = fc
      .tuple(
        fc.stringMatching(/^[a-z]{3,8}$/),
        fc.integer({ min: 1000, max: 9999 })
      )
      .map(([name, num]) => `pbt-${name}-${num}@test.test`);

    // Generate leaf values independently for better shrinkability:
    // - caverEmails: the emails to create as cavers
    // - suppressMask: a boolean per caver deciding if it's suppressed
    // - extraSuppressed: suppressed emails that don't match any caver
    const caverEmailsArb = fc.uniqueArray(testEmailArb, {
      minLength: 1,
      maxLength: 5,
    });
    const suppressMaskArb = fc.array(fc.boolean(), {
      minLength: 1,
      maxLength: 5,
    });
    const extraSuppressedArb = fc.array(
      fc
        .tuple(
          fc.stringMatching(/^[a-z]{3,8}$/),
          fc.integer({ min: 10000, max: 19999 })
        )
        .map(([name, num]) => `pbt-nomatch-${name}-${num}@test.test`),
      { maxLength: 2 }
    );

    await fc.assert(
      fc.asyncProperty(
        caverEmailsArb,
        suppressMaskArb,
        extraSuppressedArb,
        async (caverEmails, suppressMask, extraSuppressed) => {
          // Assemble the subset inside the property body
          const suppressedSubset = caverEmails.filter(
            (_, i) => suppressMask[i % suppressMask.length]
          );
          const createdIds = [];
          try {
            // Create test cavers
            for (const email of caverEmails) {
              // eslint-disable-next-line no-await-in-loop
              const caver = await TCaver.create({
                mail: email,
                nickname: `pbt-${email.split('@')[0]}`,
                language: 'fra',
                mailIsValid: true,
                dateInscription: new Date().toISOString(),
              }).fetch();
              createdIds.push(caver.id);
            }

            // Build the full suppressed list (matching + non-matching)
            const suppressedEmails = [
              ...suppressedSubset.map((e) => e.toLowerCase()),
              ...extraSuppressed.map((e) => e.toLowerCase()),
            ];

            await SesSuppressionService.markCaversAsInvalid(suppressedEmails);

            // Verify each caver's state
            for (let i = 0; i < caverEmails.length; i += 1) {
              // eslint-disable-next-line no-await-in-loop
              const caver = await TCaver.findOne({ id: createdIds[i] });
              const shouldBeInvalid = suppressedSubset
                .map((e) => e.toLowerCase())
                .includes(caverEmails[i].toLowerCase());

              should(caver.mailIsValid).equal(
                !shouldBeInvalid,
                `Caver ${caverEmails[i]} should have mailIsValid=${!shouldBeInvalid}`
              );
            }
          } finally {
            // Clean up created cavers
            if (createdIds.length > 0) {
              await TCaver.destroy({ id: createdIds });
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: ses-suppression-polling
 * Property 4: Marking cavers as invalid is idempotent
 *
 * For any set of suppressed email addresses, calling markCaversAsInvalid twice
 * with the same list produces the same database state as calling it once — the
 * second call updates zero rows.
 *
 * Validates: Requirements 3.3
 */
describe('SesSuppressionService - Property 4: Marking cavers as invalid is idempotent', () => {
  it('should return 0 updated rows on the second call', async function () {
    this.timeout(120000);

    const testEmailArb = fc
      .tuple(
        fc.stringMatching(/^[a-z]{3,8}$/),
        fc.integer({ min: 20000, max: 29999 })
      )
      .map(([name, num]) => `pbt-idem-${name}-${num}@test.test`);

    const emailsArb = fc.uniqueArray(testEmailArb, {
      minLength: 1,
      maxLength: 5,
    });

    await fc.assert(
      fc.asyncProperty(emailsArb, async (caverEmails) => {
        const createdIds = [];
        try {
          // Create test cavers
          for (const email of caverEmails) {
            // eslint-disable-next-line no-await-in-loop
            const caver = await TCaver.create({
              mail: email,
              nickname: `pbt-${email.split('@')[0]}`,
              language: 'fra',
              mailIsValid: true,
              dateInscription: new Date().toISOString(),
            }).fetch();
            createdIds.push(caver.id);
          }

          const suppressedEmails = caverEmails.map((e) => e.toLowerCase());

          // First call — should update all cavers
          const firstCount =
            await SesSuppressionService.markCaversAsInvalid(suppressedEmails);
          should(firstCount).equal(caverEmails.length);

          // Second call — should update zero rows (idempotent)
          const secondCount =
            await SesSuppressionService.markCaversAsInvalid(suppressedEmails);
          should(secondCount).equal(0);

          // Verify DB state is the same after both calls
          for (const id of createdIds) {
            // eslint-disable-next-line no-await-in-loop
            const caver = await TCaver.findOne({ id });
            should(caver.mailIsValid).be.false();
          }
        } finally {
          if (createdIds.length > 0) {
            await TCaver.destroy({ id: createdIds });
          }
        }
      }),
      { numRuns: 100 }
    );
  });
});
