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
// the key are what make the JSON form match too. Matching the closing quote is
// what lets this one span whitespace and keep the rest of the object intact; the
// unquoted forms are handled separately below, under tighter constraints.
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
// as a query parameter needs this.
//
// Every parameter is matched and the *name* is then tested, rather than building
// the sensitive words into the pattern: a name is not always literal text.
// `?token[]=`, `?token[0]=` (the array forms `qs` accepts) and `?%74oken=` all
// reach `req.param('token')`, and none of them puts `token` immediately before
// the `=`.
//
// Known limit: a value in a *path* segment stays visible. Nothing marks the
// segment in `/verify/abc123` as sensitive, so prefer a request body or a query
// parameter for anything that should not be logged.
const QUERY_PARAM = /([?&])([^=&\s"'`]+)=([^&\s"'`]*)/g;

// One pass only, which is deliberate: `qs` decodes once too, so `%2574oken`
// arrives as the parameter `%74oken` and is not the credential it imitates.
// Decoding twice here would redact values the application never reads as
// sensitive, and `decodeURIComponent` throws on a malformed escape.
const decodeOnce = (name) => {
  try {
    return decodeURIComponent(name);
  } catch {
    return name;
  }
};

// Unquoted `password=value` / `authorization: Bearer value`. `util.inspect` and
// `JSON.stringify` quote their strings, so an unquoted value reaching the log is
// either an environment/connection-string dump or a hand-concatenated message --
// both of which do carry credentials.
//
// This over-matches: `passwordAuth: Enabled` loses `Enabled`, and `token: 5`
// loses the count. That is the intended trade. The value class is kept narrow so
// only the one token goes and the rest of the line survives, and the separator
// allows no newline so a `password:` at the end of a line cannot swallow the
// first word of the next one.
//
// The leading lookbehind is what keeps stack traces intact. This repo has
// `change-password.js` and `forgot-password.js`, and without it a frame reading
// `.../change-password.js:44:7` has its line and column redacted as though they
// were the credential -- destroying the triage value of a stack in exactly the
// auth flows where it is needed. Rejecting a key preceded by a word character,
// dot, hyphen or slash means the key has to start at a token boundary and cannot
// be a path segment.
const AUTH_SCHEMES = 'Bearer|Basic|Digest|Token|APIKey';
const UNQUOTED_SECRET = new RegExp(
  `(?<![\\w/\\\\.-])([\\w.-]*(?:${SECRET_KEYS})[\\w.-]*)([ \\t]*[:=][ \\t]*)` +
    `((?:${AUTH_SCHEMES})[ \\t]+)?([^\\s,;&(){}\\[\\]"'\`]+)`,
  'gi'
);

// Cheap pre-check so the common case never touches a regex. This runs on every
// log call, including the per-request `Req ::` / `Res ::` lines.
const SENTINELS = SENSITIVE_FIELDS.concat(['postgres://', 'postgresql://']);

// A percent-encoded parameter name hides the sentinel from the check above --
// `?%74oken=` contains neither `token` nor any other sentinel -- while `qs`
// still parses it as `token`. So a string carrying any percent escape has to be
// scrubbed regardless of what the sentinel check says.
const PERCENT_ESCAPE = /%[0-9a-f]{2}/i;

const isSensitiveKey = (key) =>
  SENSITIVE_FIELDS.some((field) => key.toLowerCase().includes(field));

const redactQueryParam = (match, lead, name) =>
  isSensitiveKey(decodeOnce(name)) ? `${lead}${name}=${REDACTED}` : match;

const redactUnquoted = (match, key, separator, scheme) =>
  `${key}${separator}${scheme || ''}${REDACTED}`;

const scrubString = (value) => {
  const lowered = value.toLowerCase();
  if (
    !SENTINELS.some((sentinel) => lowered.includes(sentinel)) &&
    !PERCENT_ESCAPE.test(value)
  ) {
    return value;
  }
  // Quoted forms first: they are unambiguous, and redacting them leaves a
  // `'[REDACTED]'` that the unquoted pass below will not match again.
  return value
    .replace(INSPECTED_SECRET, `$1$2$3${REDACTED}$3`)
    .replace(CONNECTION_URI, `$1:${REDACTED}@`)
    .replace(QUERY_PARAM, redactQueryParam)
    .replace(UNQUOTED_SECRET, redactUnquoted);
};

// A datastore config is recognisable by carrying an adapter name alongside a
// credential. Matching on the pair avoids nuking unrelated objects that happen
// to have a `password` field.
const isDatastoreConfig = (value) =>
  typeof value.adapter === 'string' &&
  Object.keys(value).some((key) => isSensitiveKey(key));

// util.inspect renders these from internal state rather than from own enumerable
// properties, so rebuilding them with Object.keys() would print `{}` -- or, for a
// Buffer, a map of byte indices -- and throw away the diagnostic. None of them
// holds nested values, so they pass through untouched. Map and Set do hold
// nested values and are rebuilt instead, below.
const isOpaque = (value) =>
  value instanceof Date ||
  value instanceof RegExp ||
  value instanceof ArrayBuffer ||
  ArrayBuffer.isView(value);

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
    if (isOpaque(value)) {
      return value;
    }
    if (Array.isArray(value)) {
      return value.map((item) => redactValue(item, depth + 1, seen));
    }
    if (value instanceof Map) {
      // A Map key can be sensitive the same way an object key can, so it gets
      // the same treatment; a non-string key is only walked, never matched.
      return new Map(
        Array.from(value, ([key, item]) => [
          redactValue(key, depth + 1, seen),
          typeof key === 'string' && isSensitiveKey(key)
            ? REDACTED
            : redactValue(item, depth + 1, seen),
        ])
      );
    }
    if (value instanceof Set) {
      return new Set(
        Array.from(value, (item) => redactValue(item, depth + 1, seen))
      );
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
