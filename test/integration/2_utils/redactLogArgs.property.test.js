const util = require('util');
const should = require('should');
const fc = require('fast-check');
const redactLogArgs = require('../../../api/utils/redactLogArgs');
const { SENSITIVE_FIELDS } = require('../../../api/utils/sanitize');

// The base64 alphabet, because that is what `openssl rand -base64 32` produces
// and therefore what the real credentials look like. A minimum length of 16
// keeps a generated secret from accidentally occurring as a substring of the
// surrounding log text, which would make a passing assertion meaningless.
const BASE64_CHARS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='.split('');

const secretArb = fc
  .array(fc.constantFrom(...BASE64_CHARS), { minLength: 16, maxLength: 44 })
  .map((chars) => chars.join(''));

const keyArb = fc.constantFrom(...SENSITIVE_FIELDS);

// What captains-log ends up writing to the sink.
const render = (value) => util.inspect(value, { depth: 12 });

describe('redactLogArgs - Property: a secret never survives redaction', () => {
  it('should remove a secret held under any sensitive key at any depth', () => {
    fc.assert(
      fc.property(
        secretArb,
        keyArb,
        fc.integer({ min: 0, max: 12 }),
        (secret, key, depth) => {
          let value = { [key]: secret };
          for (let i = 0; i < depth; i += 1) {
            value = i % 2 === 0 ? { meta: value } : { raw: [value] };
          }

          should(render(redactLogArgs(value))).not.containEql(secret);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('should remove a secret embedded in a string by util.inspect or JSON', () => {
    const quoteArb = fc.constantFrom("'", '"', '`');
    const separatorArb = fc.constantFrom(': ', ':', ' = ', '=');

    fc.assert(
      fc.property(
        secretArb,
        keyArb,
        quoteArb,
        separatorArb,
        (secret, key, quote, separator) => {
          const line = `Sending 500 response: { host: 'db.example.org', ${quote}${key}${quote}${separator}${quote}${secret}${quote} }`;

          should(redactLogArgs(line)).not.containEql(secret);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('should remove a secret from a connection URI', () => {
    fc.assert(
      fc.property(
        secretArb,
        fc.constantFrom('postgres', 'postgresql'),
        (secret, scheme) => {
          const line = `could not connect to ${scheme}://grottoce:${secret}@db.example.org:5432/grottoce`;

          should(redactLogArgs(line)).not.containEql(secret);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('should remove a secret from a URL query parameter', () => {
    // `?` for the first parameter, `&` for any later one.
    const positionArb = fc.constantFrom('?', '&');

    fc.assert(
      fc.property(secretArb, keyArb, positionArb, (secret, key, position) => {
        const prefix = position === '?' ? '?' : '?page=2&';
        const line = `Res :: GET /api/v1/verify-email${prefix}${key}=${secret}&lang=fr 500 4ms`;

        const scrubbed = redactLogArgs(line);

        should(scrubbed).not.containEql(secret);
        // The surrounding line has to survive, or the log stops being usable.
        should(scrubbed).containEql('lang=fr');
        should(scrubbed).containEql('500 4ms');
      }),
      { numRuns: 200 }
    );
  });

  it('should remove a secret from a query parameter however its name is written', () => {
    // The four spellings that all reach `req.param(<key>)`: bare, the two array
    // forms `qs` accepts, and percent-encoded on the first character. Only the
    // first puts the sensitive word directly before the `=`.
    const spellingArb = fc.constantFrom(
      (key) => key,
      (key) => `${key}[]`,
      (key) => `${key}[0]`,
      (key) => `%${key.charCodeAt(0).toString(16)}${key.slice(1)}`
    );

    fc.assert(
      fc.property(secretArb, keyArb, spellingArb, (secret, key, spell) => {
        const line = `Req :: GET /api/v1/verify-email?${spell(
          key
        )}=${secret}&lang=fr`;

        const scrubbed = redactLogArgs(line);

        should(scrubbed).not.containEql(secret);
        should(scrubbed).containEql('lang=fr');
      }),
      { numRuns: 300 }
    );
  });

  it('should remove an unquoted secret whatever separator introduces it', () => {
    const separatorArb = fc.constantFrom(': ', ':', ' = ', '=', '\t');
    const schemeArb = fc.constantFrom('', 'Bearer ', 'Basic ', 'Token ');

    fc.assert(
      fc.property(
        secretArb,
        keyArb,
        separatorArb,
        schemeArb,
        (secret, key, separator, scheme) => {
          const sep = separator === '\t' ? ':\t' : separator;
          const line = `connecting with ${key}${sep}${scheme}${secret} to db.example.org`;

          const scrubbed = redactLogArgs(line);

          should(scrubbed).not.containEql(secret);
          // The tail of the line has to survive, or the scrub is eating the log.
          should(scrubbed).containEql('to db.example.org');
        }
      ),
      { numRuns: 300 }
    );
  });

  it('should remove a secret carried by an Error, in message, stack and meta', () => {
    fc.assert(
      fc.property(secretArb, (secret) => {
        const meta = {
          adapter: 'sails-postgresql',
          user: 'grottoce',
          password: secret,
          url: `postgres://grottoce:${secret}@db.example.org:5432/grottoce`,
        };
        const inner = new Error(
          `Could not connect: ${util.inspect({ meta }, { depth: 5 })}`
        );
        inner.name = 'AdapterError';
        inner.meta = meta;
        const outer = new Error(
          `Error on model \`entrance\`: ${inner.message}`
        );
        outer.name = 'AdapterError';
        outer.meta = meta;
        outer.cause = inner;

        const redacted = redactLogArgs(outer);

        should(redacted.message).not.containEql(secret);
        should(redacted.stack).not.containEql(secret);
        should(render(redacted)).not.containEql(secret);
      }),
      { numRuns: 100 }
    );
  });
});

describe('redactLogArgs - Property: non-sensitive content survives', () => {
  it('should return any string with no sensitive keyword by identity', () => {
    const plainArb = fc.string({ minLength: 1, maxLength: 200 }).filter((s) => {
      const lowered = s.toLowerCase();
      return !SENSITIVE_FIELDS.concat(['postgres://', 'postgresql://']).some(
        (sentinel) => lowered.includes(sentinel)
      );
    });

    fc.assert(
      fc.property(plainArb, (line) => {
        should(redactLogArgs(line)).equal(line);
      }),
      { numRuns: 300 }
    );
  });

  it('should return any primitive unchanged', () => {
    const primitiveArb = fc.oneof(
      fc.integer(),
      fc.double({ noNaN: true }),
      fc.boolean(),
      fc.constant(null),
      fc.constant(undefined)
    );

    fc.assert(
      fc.property(primitiveArb, (value) => {
        should(redactLogArgs(value)).equal(value);
      }),
      { numRuns: 200 }
    );
  });

  it('should preserve non-sensitive keys and values on an object', () => {
    // Built from an alphabet rather than filtered out of fc.string(), so
    // fast-check is not left discarding almost every generated value.
    const IDENTIFIER_CHARS =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_'.split(
        ''
      );
    const safeKeyArb = fc
      .array(fc.constantFrom(...IDENTIFIER_CHARS), {
        minLength: 1,
        maxLength: 20,
      })
      .map((chars) => chars.join(''))
      .filter((key) => {
        const lowered = key.toLowerCase();
        return !SENSITIVE_FIELDS.some((field) => lowered.includes(field));
      });

    fc.assert(
      fc.property(safeKeyArb, fc.integer(), (key, value) => {
        should(redactLogArgs({ [key]: value })[key]).equal(value);
      }),
      { numRuns: 200 }
    );
  });

  it('should keep an Error an Error, with its name and stack', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 60 }),
        fc.constantFrom('Error', 'TypeError', 'AdapterError', 'UsageError'),
        (message, name) => {
          const error = new Error(message);
          error.name = name;

          const redacted = redactLogArgs(error);

          should(redacted).be.an.instanceOf(Error);
          should(redacted.name).equal(name);
          should(redacted.stack).be.a.String();
          should(redacted.stack.length).be.above(0);
        }
      ),
      { numRuns: 200 }
    );
  });
});
