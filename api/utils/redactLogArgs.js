/**
 * Redaction for values on their way into the log sink.
 *
 * This exists because logging a raw error is not safe: Waterline adapter errors
 * carry the datastore configuration (including the password) on `meta`, and
 * repeat it under `cause`. Worse, `machine` composes its error messages by
 * appending `util.inspect(rawOutput)`, so the secret is also plain text inside
 * `message` -- and therefore inside `stack`. Redacting by key alone cannot
 * remove it, so strings are scrubbed too.
 *
 * `api/utils/sanitize.js` cannot be reused as-is here: it rebuilds a plain
 * object from `Object.keys()`, and `name`, `message` and `stack` are
 * non-enumerable on Error, so it would silently discard the stack trace that
 * makes the log worth having. This module is error-aware instead.
 *
 * Applied at the `patchSailsLog()` chokepoint in api/utils/logger.js, which
 * covers every `sails.log.*` call site in one place.
 *
 * Pure and free of any reference to the `sails` global, so config/log.js can
 * require it before Sails lifts.
 */

const { SENSITIVE_FIELDS } = require('./sanitize');

const REDACTED = '[REDACTED]';
// The adapter's `meta` block carries `user`, `database` and `url` next to the
// password, so the whole block goes rather than just the one key.
const REDACTED_DATASTORE = '[REDACTED datastore config]';
const DEPTH_LIMIT = '[REDACTED: depth limit]';
const CIRCULAR = '[Circular]';

// Adapter errors nest about four deep (err.cause.meta.ssl.rejectUnauthorized).
// Ten leaves headroom while still bounding the walk. Anything deeper is replaced
// rather than returned as-is, so a secret can never fall out through the cap.
const MAX_DEPTH = 10;

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const SECRET_KEYS = SENSITIVE_FIELDS.map(escapeRegExp).join('|');

// `password: 'value'`, `"password":"value"`, `apiKey = "value"` -- the quoted
// forms produced by util.inspect and JSON.stringify. The optional quotes around
// the key are what make the JSON form match too. Unquoted values are left alone
// on purpose: `passwordAuth: Enabled` is not a secret, and over-matching costs
// us the diagnostics this whole change is meant to protect.
const INSPECTED_SECRET = new RegExp(
  `(["'\`]?[\\w.-]*(?:${SECRET_KEYS})[\\w.-]*["'\`]?)(\\s*[:=]\\s*)(["'\`])(?:\\\\.|(?!\\3)[\\s\\S])*?\\3`,
  'gi'
);

// postgres://user:password@host -- sails-postgresql redacts this in err.meta.url
// and err.message, but not in err.stack and not under err.cause.
const CONNECTION_URI = /\b(postgres(?:ql)?:\/\/[^:\s/@]+):[^@\s]*@/gi;

// `?token=value` / `&apiKey=value`. Query parameters are unquoted, so the
// pattern above cannot reach them, and both the `Req ::` and `Res ::` lines in
// config/http.js log `req.url` verbatim -- so any route that takes a credential
// as a query parameter needs this. Anchoring on a leading `?`/`&` and a trailing
// `=` is what keeps it from matching prose such as `passwordAuth: Enabled`.
//
// Known limit: a value in a *path* segment stays visible. Nothing marks the
// segment in `/verify/abc123` as sensitive, so prefer a request body or a query
// parameter for anything that should not be logged.
const QUERY_SECRET = new RegExp(
  `([?&][\\w.-]*(?:${SECRET_KEYS})[\\w.-]*=)[^&\\s"'\`]*`,
  'gi'
);

// Cheap pre-check so the common case never touches a regex. This runs on every
// log call, including the per-request `Req ::` / `Res ::` lines.
const SENTINELS = SENSITIVE_FIELDS.concat(['postgres://', 'postgresql://']);

const isSensitiveKey = (key) =>
  SENSITIVE_FIELDS.some((field) => key.toLowerCase().includes(field));

const scrubString = (value) => {
  const lowered = value.toLowerCase();
  if (!SENTINELS.some((sentinel) => lowered.includes(sentinel))) {
    return value;
  }
  return value
    .replace(INSPECTED_SECRET, `$1$2$3${REDACTED}$3`)
    .replace(CONNECTION_URI, `$1:${REDACTED}@`)
    .replace(QUERY_SECRET, `$1${REDACTED}`);
};

// A datastore config is recognisable by carrying an adapter name alongside a
// credential. Matching on the pair avoids nuking unrelated objects that happen
// to have a `password` field.
const isDatastoreConfig = (value) =>
  typeof value.adapter === 'string' &&
  Object.keys(value).some((key) => isSensitiveKey(key));

// `redactValue`, `redactOwnKeys` and `redactError` are mutually recursive: a
// value can hold an error, an error's properties can hold values. Whichever is
// declared first therefore has to name a later one, so the rule cannot be
// satisfied by reordering.
/* eslint-disable no-use-before-define */
const redactValue = (value, depth, seen) => {
  if (typeof value === 'string') {
    return scrubString(value);
  }
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (depth >= MAX_DEPTH) {
    return DEPTH_LIMIT;
  }
  if (seen.has(value)) {
    return CIRCULAR;
  }

  // `seen` tracks the current ancestor path, not every object already visited,
  // so it is cleared on the way back out. Adapter errors share one `meta` object
  // between the error and its `cause`; treating a repeated reference as a cycle
  // would render the second one as [Circular] and lose the redaction marker.
  seen.add(value);
  try {
    if (value instanceof Error) {
      return redactError(value, depth, seen);
    }
    if (Array.isArray(value)) {
      return value.map((item) => redactValue(item, depth + 1, seen));
    }
    if (isDatastoreConfig(value)) {
      return REDACTED_DATASTORE;
    }
    return redactOwnKeys(value, {}, depth, seen);
  } finally {
    seen.delete(value);
  }
};

const redactOwnKeys = (source, target, depth, seen) =>
  Object.keys(source).reduce((acc, key) => {
    if (isSensitiveKey(key)) {
      acc[key] = REDACTED;
    } else {
      acc[key] = redactValue(source[key], depth + 1, seen);
    }
    return acc;
  }, target);

/**
 * Rebuilds an Error rather than mutating the original, which is still on its way
 * to error handlers that may depend on it.
 *
 * The result is a real Error so that captains-log's `_.isError(arg)` branch
 * (node_modules/captains-log/lib/write.js) still renders it as one. Note that
 * the same branch is skipped for anything carrying an `inspect` property, so do
 * not add one here.
 */
const redactError = (error, depth, seen) => {
  const redacted = new Error(
    typeof error.message === 'string' ? scrubString(error.message) : ''
  );
  redacted.name = error.name;

  // util.inspect prints an Error from its stack, so this is the line that
  // decides what actually reaches the log. Carrying the original over (scrubbed)
  // is what preserves the class name, message and app frames -- the whole point
  // of redacting instead of dropping the error.
  if (typeof error.stack === 'string') {
    redacted.stack = scrubString(error.stack);
  }

  const ownKeys = Object.keys(error);
  redactOwnKeys(error, redacted, depth, seen);

  // `cause` is enumerable on flaverr-built errors but not on ones built with
  // `new Error(msg, { cause })`, so pick up the non-enumerable case too and
  // keep it non-enumerable to match.
  if (!ownKeys.includes('cause') && error.cause !== undefined) {
    Object.defineProperty(redacted, 'cause', {
      value: redactValue(error.cause, depth + 1, seen),
      enumerable: false,
      writable: true,
      configurable: true,
    });
  }

  return redacted;
};
/* eslint-enable no-use-before-define */

/** Redacts one log argument. Primitives and secret-free strings pass through. */
const redactLogArgs = (value) => redactValue(value, 0, new WeakSet());

module.exports = redactLogArgs;
// Used by config/log.js, which only ever sees the already-flattened log string.
module.exports.scrubString = scrubString;
