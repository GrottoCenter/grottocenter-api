const util = require('util');
const should = require('should');
const redactLogArgs = require('../../../api/utils/redactLogArgs');

const { scrubString } = redactLogArgs;

const SECRET = 'Tr0ub4dor-3-correct-horse-battery';
const REDACTED = '[REDACTED]';
const REDACTED_DATASTORE = '[REDACTED datastore config]';

// The datastore config the adapter hangs off `err.meta`. It carries the host,
// user and database next to the password, which is why the whole block goes.
const datastoreConfig = () => ({
  adapter: 'sails-postgresql',
  url: `postgres://grottoce:${SECRET}@example.postgres.database.azure.com:5432/grottoce`,
  host: 'example.postgres.database.azure.com',
  user: 'grottoce',
  password: SECRET,
  database: 'grottoce',
  ssl: { rejectUnauthorized: true },
});

/**
 * Reproduces the shape an adapter connection failure actually reaches the log
 * with: `machine` bakes `util.inspect(rawOutput)` into the message (so the
 * secret is plain text in `message` and therefore in `stack`), the config is
 * hung off `meta`, and the *same* `meta` object is shared with `cause`.
 */
const buildAdapterError = () => {
  const meta = datastoreConfig();
  const inner = new Error(
    `Could not connect to the database: ${util.inspect(
      { error: new Error('connect ECONNREFUSED 10.0.0.4:5432'), meta },
      { depth: 5 }
    )}`
  );
  inner.name = 'AdapterError';
  inner.meta = meta;

  const outer = new Error(`Error on model \`entrance\`: ${inner.message}`);
  outer.name = 'AdapterError';
  outer.modelIdentity = 'entrance';
  outer.meta = meta;
  outer.cause = inner;
  return outer;
};

// What captains-log ends up writing: util.inspect on an Error renders it from
// its stack, then appends the enumerable own properties.
const render = (value) => util.inspect(value, { depth: 10 });

describe('redactLogArgs', () => {
  describe('the production adapter-error shape', () => {
    it('should not leak the secret anywhere in the rendered output', () => {
      const rendered = render(redactLogArgs(buildAdapterError()));

      should(rendered).not.containEql(SECRET);
    });

    it('should not leak the secret through message or stack', () => {
      const redacted = redactLogArgs(buildAdapterError());

      should(redacted.message).not.containEql(SECRET);
      should(redacted.stack).not.containEql(SECRET);
    });

    it('should replace the whole meta block when adapter and password co-occur', () => {
      const redacted = redactLogArgs(buildAdapterError());

      should(redacted.meta).equal(REDACTED_DATASTORE);
    });

    it('should replace the shared meta block under cause as well', () => {
      // Regression guard: `meta` is the same object reference in both places.
      // A visited-set cycle guard would render the second one as [Circular] and
      // lose the redaction marker, which reads as if nothing was redacted.
      const redacted = redactLogArgs(buildAdapterError());

      should(redacted.cause.meta).equal(REDACTED_DATASTORE);
    });

    it('should keep the diagnostics that make the log worth having', () => {
      const redacted = redactLogArgs(buildAdapterError());

      should(redacted).be.an.instanceOf(Error);
      should(redacted.name).equal('AdapterError');
      should(redacted.message).startWith('Error on model `entrance`:');
      should(redacted.modelIdentity).equal('entrance');
      should(redacted.stack).containEql('AdapterError');
      should(redacted.cause).be.an.instanceOf(Error);
    });

    it('should not carry an inspect property', () => {
      // captains-log skips its `_.isError` rendering branch for anything with
      // an `inspect` property (node_modules/captains-log/lib/write.js).
      const redacted = redactLogArgs(buildAdapterError());

      should(redacted.inspect).be.undefined();
    });
  });

  describe('structured values', () => {
    it('should redact a sensitive key on a plain object', () => {
      const redacted = redactLogArgs({ user: 'grottoce', password: SECRET });

      should(redacted.user).equal('grottoce');
      should(redacted.password).equal(REDACTED);
    });

    it('should keep sibling keys when the object is not a datastore config', () => {
      // No `adapter`, so only the credential itself goes.
      const redacted = redactLogArgs({ host: 'db.example.org', token: SECRET });

      should(redacted.host).equal('db.example.org');
      should(redacted.token).equal(REDACTED);
    });

    it('should recurse into nested objects and arrays', () => {
      const redacted = redactLogArgs({
        raw: { connections: [{ label: 'primary', apiKey: SECRET }] },
      });

      should(redacted.raw.connections[0].label).equal('primary');
      should(redacted.raw.connections[0].apiKey).equal(REDACTED);
    });

    it('should reach a secret nested deeper than sanitize would go', () => {
      // sanitize.js stops at maxDepth 3; `err.cause.cause.meta.password` is
      // deeper than that, which is why this module has its own walk.
      const redacted = redactLogArgs({
        cause: { cause: { meta: { credentials: { password: SECRET } } } },
      });

      should(render(redacted)).not.containEql(SECRET);
    });

    it('should not leak a secret through the depth cap', () => {
      let deep = { password: SECRET };
      for (let i = 0; i < 15; i += 1) {
        deep = { nested: deep };
      }

      should(render(redactLogArgs(deep))).not.containEql(SECRET);
    });

    it('should terminate on a genuine cycle', () => {
      const node = { name: 'a' };
      node.self = node;
      node.list = [node];

      const redacted = redactLogArgs(node);

      should(redacted.name).equal('a');
      should(redacted.self).equal('[Circular]');
      should(redacted.list[0]).equal('[Circular]');
    });

    it('should pick up a non-enumerable cause', () => {
      // `new Error(msg, { cause })` makes `cause` non-enumerable, unlike the
      // flaverr-built errors the adapter throws.
      const error = new Error('outer', {
        cause: new Error(`inner password: '${SECRET}'`),
      });

      const redacted = redactLogArgs(error);

      should(redacted.cause).be.an.instanceOf(Error);
      should(redacted.cause.message).not.containEql(SECRET);
    });
  });

  describe('pass-through', () => {
    it('should return primitives unchanged', () => {
      should(redactLogArgs(42)).equal(42);
      should(redactLogArgs(true)).equal(true);
      should(redactLogArgs(null)).equal(null);
      should(redactLogArgs(undefined)).be.undefined();
    });

    it('should return a secret-free string by identity', () => {
      const line = 'Res :: GET /api/v1/entrances 200 12ms';

      should(redactLogArgs(line)).equal(line);
    });

    it('should leave a non-secret value that merely mentions a keyword', () => {
      // `passwordAuth: Enabled` is configuration state, not a credential.
      // Over-matching costs the diagnostics this change exists to protect.
      const line = 'passwordAuth: Enabled, activeDirectoryAuth: Disabled';

      should(redactLogArgs(line)).equal(line);
    });
  });

  describe('scrubString', () => {
    it('should scrub the util.inspect form', () => {
      const scrubbed = scrubString(
        `{ user: 'grottoce', password: '${SECRET}' }`
      );

      should(scrubbed).not.containEql(SECRET);
      should(scrubbed).containEql(`password: '${REDACTED}'`);
      should(scrubbed).containEql("user: 'grottoce'");
    });

    it('should scrub the JSON form', () => {
      const scrubbed = scrubString(`{"apiKey":"${SECRET}","page":1}`);

      should(scrubbed).not.containEql(SECRET);
      should(scrubbed).containEql('"page":1');
    });

    it('should scrub an assignment form', () => {
      const scrubbed = scrubString(`SAILS_SECRET = "${SECRET}"`);

      should(scrubbed).not.containEql(SECRET);
    });

    it('should scrub a connection URI while keeping the user and host', () => {
      const scrubbed = scrubString(
        `postgres://grottoce:${SECRET}@db.example.org:5432/grottoce`
      );

      should(scrubbed).not.containEql(SECRET);
      should(scrubbed).equal(
        `postgres://grottoce:${REDACTED}@db.example.org:5432/grottoce`
      );
    });

    it('should scrub a postgresql:// URI too', () => {
      const scrubbed = scrubString(
        `postgresql://grottoce:${SECRET}@db.example.org/grottoce`
      );

      should(scrubbed).not.containEql(SECRET);
    });

    it('should scrub every occurrence, not just the first', () => {
      const scrubbed = scrubString(
        `password: '${SECRET}' and again password: '${SECRET}'`
      );

      should(scrubbed).not.containEql(SECRET);
    });

    it('should return a secret-free string by identity', () => {
      const line = 'Req :: GET /api/v1/caves/42';

      should(scrubString(line)).equal(line);
    });
  });

  // `requestLogger` and `responseTimeLogger` both log `req.url` verbatim, so a
  // query parameter holding a credential has to be scrubbed as a string -- the
  // structured redaction of `req.query` never sees the raw URL.
  describe('URL query parameters', () => {
    it('should scrub a token in a query string while keeping the rest of the line', () => {
      const scrubbed = scrubString(
        `Req :: GET /api/v1/verify-email?token=${SECRET}`
      );

      should(scrubbed).equal(
        `Req :: GET /api/v1/verify-email?token=${REDACTED}`
      );
    });

    it('should scrub a secret in a trailing query parameter', () => {
      const scrubbed = scrubString(
        `Res :: GET /api/v1/x?page=2&apiKey=${SECRET} 200 4ms`
      );

      should(scrubbed).not.containEql(SECRET);
      should(scrubbed).containEql('page=2');
      should(scrubbed).containEql('200 4ms');
    });

    it('should stop at the next parameter separator', () => {
      const scrubbed = scrubString(
        `/api/v1/verify-email?token=${SECRET}&lang=fr`
      );

      should(scrubbed).equal(`/api/v1/verify-email?token=${REDACTED}&lang=fr`);
    });

    it('should leave a non-sensitive query parameter alone', () => {
      const line = '/api/v1/entrances?page=2&sort=name&order=desc';

      should(scrubString(line)).equal(line);
    });

    it('should redact any parameter whose name contains a sensitive word', () => {
      // Substring matching, the same rule sanitize.js has always used. It
      // over-matches by design: a parameter called `tokenCount` loses its value,
      // which is a better failure than one called `resetToken` keeping it.
      const scrubbed = scrubString('/api/v1/x?userToken=abc&tokenCount=5');

      should(scrubbed).equal(
        `/api/v1/x?userToken=${REDACTED}&tokenCount=${REDACTED}`
      );
    });

    it('should leave a path that merely mentions a keyword alone', () => {
      // No `?`/`&` and no `=`, so the pattern cannot fire. GET /csrfToken is a
      // real route and must keep logging its path.
      const line = 'Req :: GET /csrfToken';

      should(scrubString(line)).equal(line);
    });

    it('should not pretend to redact a secret in a path segment', () => {
      // Documents a real limitation: nothing marks `/verify/abc123` as
      // sensitive, so a credential placed in a path segment still reaches the
      // log. Recorded here so the gap is visible rather than assumed covered.
      const line = '/api/v1/verify/abc123secretvalue';

      should(scrubString(line)).equal(line);
    });
  });
});
