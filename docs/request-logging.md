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
