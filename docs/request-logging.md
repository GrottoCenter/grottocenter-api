# Request logging

Reference for anything that reads the API's request logs (Azure Monitor
workbook queries, ad-hoc KQL). Introduced by
[#1788](https://github.com/GrottoCenter/grottocenter-api/issues/1788).

## The `Access ::` line

`responseTimeLogger` (`config/http.js`) writes one line per request, once its
outcome is known. It runs right after `traceId`, so the line is written even
for responses sent before the router: CORS preflights (`OPTIONS`, 200), token
rejections by `parseAuthToken` (401) and rate-limit refusals (429).

```text
[<traceId>] Access :: {"method":"GET","path":"/api/v1/geoloc/entrances","status":200,"durationMs":42,"ip":"37.58.156.218","userAgent":"okhttp/4.9.2","origin":null,"referer":null,"authenticated":false,"userId":null}
```

Everything after `Access :: ` is one JSON object, built by
`api/utils/accessLogEntry.js`. Inside its strings, `:` and `=` are written
`\u003a` and `\u003d` (`"https\u003a//…"`): the log redaction is not JSON-aware,
and this keeps it from corrupting the line. Any JSON parser restores them.

| Field           | Value                                                                                 |
| --------------- | ------------------------------------------------------------------------------------- |
| `method`        | HTTP method                                                                           |
| `path`          | Request path, **without** the query string (the full URL is on the `Res ::` line)     |
| `status`        | Response status; `499` when the client closed the connection first                    |
| `durationMs`    | Milliseconds from the middleware to the end of the response (or to the abort), number |
| `ip`            | Client IP without its source port; `null` if unknown                                  |
| `userAgent`     | `User-Agent` header, or `null`                                                        |
| `origin`        | `Origin` header only, or `null`                                                       |
| `referer`       | `Referer` header only (a full URL, sensitive query values redacted), or `null`        |
| `authenticated` | `true` when the request carried a valid authentication token                          |
| `userId`        | The authenticated user's id, or `null`                                                |

Things to know when querying it:

- **`null` means the header was absent.** Native apps and HTTP libraries
  (`okhttp`, `CFNetwork`, …) never send `Origin`; a `null` origin is not by itself
  a bot signal. In KQL, `tostring()` turns that `null` into `""`, the same as an
  empty header: filter on the `has*` columns below, not on the strings.
- **`origin` and `referer` are different signals.** `Origin` is set by the
  browser and is scheme, host and port only. `Referer` is client-controlled and
  often stripped.
- **`authenticated`** is the reliable human signal; prefer it to User-Agent
  pattern matching.
- No other header, cookie or token content is logged.

### KQL

```kusto
AppServiceConsoleLogs
| where ResultDescription has "Access :: "
| extend a = parse_json(extract(@"Access :: (.*)$", 1, ResultDescription))
| project TimeGenerated,
    method = tostring(a.method), path = tostring(a.path), status = toint(a.status),
    durationMs = toint(a.durationMs), ip = tostring(a.ip),
    userAgent = tostring(a.userAgent), origin = tostring(a.origin),
    referer = tostring(a.referer), authenticated = tobool(a.authenticated),
    userId = toint(a.userId),
    // Before tostring() folds null into "": was the header sent at all?
    hasUserAgent = isnotnull(a.userAgent), hasOrigin = isnotnull(a.origin),
    hasReferer = isnotnull(a.referer)
```

## Server errors and client aborts

`Sending 500 ("Server Error") response` (`error` level, written by
`api/responses/serverError.js`) is the line to count for real server errors.

Since [#1908](https://github.com/GrottoCenter/grottocenter-api/pull/1908), the
API cancels the Postgres queries of a `GET` or `HEAD` request whose client
disconnected before the response was sent. Such a request produces no `error`
line at all:

- `Res :: (client aborted) <method> <url> 499 <n>ms (<k> backend(s) cancelled)`
  and the `Access ::` line with `status` 499, both at `info`, when the client
  disconnects;
- `(after client abort) …` at `warn` for every error the cancellation raises on
  the way out (`57014 query_canceled`), including the one the controller logs
  itself;
- `Dropped 500 ("Server Error") response (query cancelled after client abort)`
  at `warn`, where a request still being listened to would have logged
  `Sending 500`
  ([#1919](https://github.com/GrottoCenter/grottocenter-api/issues/1919)): the
  500 carries the `57014` error itself, or the controller answered with its own
  message after the pool guard cancelled or refused one of the request's
  queries. The 500 is written to a closed socket and never leaves the process.

A 500 caused by anything other than the cancellation keeps its `Sending 500`
line at `error` level, client gone or not: an error without `57014` in its
cause chain, or a controller message when no query of the request was
cancelled. Writes (`POST`, `PUT`, `PATCH`, `DELETE`) are never cancelled: an
aborted write that fails is a real `Sending 500`.

## Legacy lines

`requestLogger` still writes the two lines below while consumers migrate to
`Access ::`. They will be removed once nothing reads them.

- `Req :: <method> <url>`
- `Client data: {"ip":…,"rawIp":…,"userAgent":…,"origin":…}`, whose `origin`
  is the `Origin` header, else the `Referer`, else the string `'unknown'`.

`requestLogger` runs after the rate limiters, so a request refused before it
has no legacy lines. The `Res :: <method> <url> <status> <time>` line from
`responseTimeLogger` keeps its format, and is now written for those requests
too.
