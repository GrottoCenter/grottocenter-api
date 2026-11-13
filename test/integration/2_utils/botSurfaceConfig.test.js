const should = require('should');
const {
  DEFAULT_SCHEDULE,
  parseEntityTypes,
  parseSchedule,
} = require('../../../api/utils/botSurfaceConfig');

describe('botSurfaceConfig - parseEntityTypes', () => {
  it('reads a comma-separated list and returns it in the canonical order', () => {
    should(parseEntityTypes('organization,massif,cave')).eql([
      'cave',
      'massif',
      'organization',
    ]);
  });

  it('accepts hub among the types', () => {
    should(parseEntityTypes('hub')).eql(['hub']);
  });

  it('tolerates spaces, case, empty entries and duplicates', () => {
    should(parseEntityTypes(' Massif , ,massif,CAVE,')).eql(['cave', 'massif']);
  });

  it('returns an empty list for an unset, empty or blank value', () => {
    should(parseEntityTypes(undefined)).eql([]);
    should(parseEntityTypes(null)).eql([]);
    should(parseEntityTypes('')).eql([]);
    should(parseEntityTypes('  , ')).eql([]);
  });

  it('fails with the unknown names and the accepted ones', () => {
    should(() => parseEntityTypes('cave,caves,document')).throw(
      /BOT_SURFACE_ENTITY_TYPES: unknown type\(s\) "caves", "document"\. Accepted: cave, massif, organization, hub/
    );
  });
});

describe('botSurfaceConfig - parseSchedule', () => {
  it('defaults to 01:30 UTC, which is provisional', () => {
    should(DEFAULT_SCHEDULE).equal('30 1 * * *');
    should(parseSchedule(undefined)).equal('30 1 * * *');
    should(parseSchedule('  ')).equal('30 1 * * *');
  });

  it('accepts valid cron expressions and single-spaces them', () => {
    should(parseSchedule('15  2 * * 1-5')).equal('15 2 * * 1-5');
    should(parseSchedule('*/10 0-6/2 1,15 * *')).equal('*/10 0-6/2 1,15 * *');
    should(parseSchedule('0 0 * * 7')).equal('0 0 * * 7');
  });

  it('rejects an expression without five fields', () => {
    should(() => parseSchedule('30 1 * *')).throw(
      /BOT_SURFACE_SCHEDULE: expected 5 cron fields/
    );
    should(() => parseSchedule('0 30 1 * * *')).throw(/expected 5 cron fields/);
  });

  [
    ['60 1 * * *', 'minute'],
    ['0 24 * * *', 'hour'],
    ['0 1 0 * *', 'day of month'],
    ['0 1 * 13 *', 'month'],
    ['0 1 * * 8', 'day of week'],
    ['abc 1 * * *', 'minute'],
    ['5-2 1 * * *', 'minute'],
    ['*/0 1 * * *', 'minute'],
    ['0 1 * * 1-2-3', 'day of week'],
  ].forEach(([expression, field]) => {
    it(`rejects "${expression}" (bad ${field})`, () => {
      should(() => parseSchedule(expression)).throw(
        new RegExp(`invalid ${field} field`)
      );
    });
  });
});

const {
  parseAuditSampleSize,
  parseAuditFailureLimit,
  parseAuditVariantSample,
  parseAuditTimeBudgetMs,
  parseAuditConfig,
} = require('../../../api/utils/botSurfaceConfig');

describe('botSurfaceConfig - the audit settings', () => {
  it('gives the documented defaults when nothing is set', () => {
    should(parseAuditConfig({})).eql({
      sampleSize: 1000,
      failureLimit: 10,
      variantSample: 20,
      timeBudgetMs: 1800000,
    });
    should(parseAuditConfig({ BOT_AUDIT_SAMPLE_SIZE: '  ' }).sampleSize).equal(
      1000
    );
  });

  it('reads each value from its variable', () => {
    should(
      parseAuditConfig({
        BOT_AUDIT_SAMPLE_SIZE: '5000',
        BOT_AUDIT_FAILURE_LIMIT: '0',
        BOT_AUDIT_VARIANT_SAMPLE: '0',
        BOT_AUDIT_TIME_BUDGET_MS: '60000',
      })
    ).eql({
      sampleSize: 5000,
      failureLimit: 0,
      variantSample: 0,
      timeBudgetMs: 60000,
    });
  });

  [
    [
      parseAuditSampleSize,
      'BOT_AUDIT_SAMPLE_SIZE',
      ['-1', '1.5', 'abc', '1e3', '100001', '0x10'],
    ],
    [
      parseAuditFailureLimit,
      'BOT_AUDIT_FAILURE_LIMIT',
      ['-1', '2.5', 'ten', ' 1 2'],
    ],
    [
      parseAuditVariantSample,
      'BOT_AUDIT_VARIANT_SAMPLE',
      ['-3', '1001', '1.0', 'x'],
    ],
    [
      parseAuditTimeBudgetMs,
      'BOT_AUDIT_TIME_BUDGET_MS',
      ['0', '999', '-5', 'soon'],
    ],
  ].forEach(([parse, name, bad]) => {
    bad.forEach((value) => {
      it(`rejects ${name}="${value}" naming the variable`, () => {
        should(() => parse(value)).throw(
          new RegExp(`^${name}: expected an integer`)
        );
      });
    });
  });

  it('accepts the bounds', () => {
    should(parseAuditSampleSize('0')).equal(0);
    should(parseAuditSampleSize('100000')).equal(100000);
    should(parseAuditVariantSample('1000')).equal(1000);
    should(parseAuditTimeBudgetMs('1000')).equal(1000);
  });
});
