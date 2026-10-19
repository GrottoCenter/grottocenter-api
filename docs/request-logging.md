# Request logging

Reference for anything that reads the API's request logs (Azure Monitor
workbook queries, ad-hoc KQL). Introduced by
[#1788](https://github.com/GrottoCenter/grottocenter-api/issues/1788).

## The `Access ::` line

`responseTimeLogger` (`config/http.js`) writes one line per request, once its
outcome is known:

```text
[<traceId>] Access :: {"method":"GET","path":"/api/v1/geoloc/entrances","status":200,"durationMs":42,"ip":"37.58.156.218","userAgent":"okhttp/4.9.2","origin":null,"referer":null,"authenticated":false,"userId":null}
```

Everything after `Access :: ` is one JSON object, built by
`api/utils/accessLogEntry.js`:

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
  a bot signal. Use `isnull()`, not a string comparison.
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
    userId = toint(a.userId)
```

## Legacy lines

`requestLogger` still writes the two lines below while consumers migrate to
`Access ::`. They will be removed once nothing reads them.

- `Req :: <method> <url>`
- `Client data: {"ip":…,"rawIp":…,"userAgent":…,"origin":…}`, whose `origin`
  is the `Origin` header, else the `Referer`, else the string `'unknown'`.

The `Res :: <method> <url> <status> <time>` line from `responseTimeLogger` is
unchanged.
