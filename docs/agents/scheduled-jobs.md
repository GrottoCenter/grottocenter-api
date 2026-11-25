# Scheduled jobs and heartbeats

Every job that runs on a schedule reports to a [Better Stack](https://betterstack.com/uptime) **heartbeat monitor**. An uptime check on `/health` proves the API answers; it cannot see a job that silently stopped. A heartbeat can: the monitor expects a ping at a fixed cadence and alerts when one is missed.

**A new scheduled job ships with its heartbeat.** The PR adds the config key, wraps the handler and documents the monitor settings in the table below.

## The scheduled jobs

| Job                                            | Schedule (UTC)                             | Env var                          | Monitor period    | Grace   |
| ---------------------------------------------- | ------------------------------------------ | -------------------------------- | ----------------- | ------- |
| `search-outbox`                                | every minute                               | `HEARTBEAT_SEARCH_OUTBOX_URL`    | 5 min (throttled) | 10 min  |
| `bot-outbox` (only when `BOT_SURFACE_ENABLED`) | every minute                               | `HEARTBEAT_BOT_OUTBOX_URL`       | 5 min (throttled) | 10 min  |
| `avatar-cleanup`                               | hourly at :23                              | `HEARTBEAT_AVATAR_CLEANUP_URL`   | 1 hour            | 15 min  |
| `bot-surface-nightly`                          | `BOT_SURFACE_SCHEDULE` (prod `30 1 * * *`) | `HEARTBEAT_BOT_PIPELINE_URL`     | 1 day             | 2 hours |
| `db-export`                                    | Sundays 03:00                              | `HEARTBEAT_DB_EXPORT_URL`        | 1 week            | 2 hours |
| `search-reconcile`                             | 1st of the month 02:00                     | `HEARTBEAT_SEARCH_RECONCILE_URL` | 1 month           | 1 day   |

The pg_cron jobs in `sql/1_cron.sql` cannot make HTTP calls and are not covered yet (#2029).

## How it works

`api/utils/heartbeat.js` exports `withHeartbeat(handler, { name, getUrl, minIntervalMs })`. The wrapped handler pings `<url>` when it returns and `<url>/fail` when it throws; the error is rethrown unchanged.

- **It never affects the job.** A missing or invalid URL, a timeout (5 s) or an unreachable monitor is logged as a warning and swallowed.
- **The URL is a secret.** It carries the monitor's token: it is never logged, and only an `https` URL of plain characters is accepted.
- **Unset means unmonitored.** Dev and tests set no URL, so nothing is sent.
- **Retries are not reported.** `db-export` and `search-reconcile` are retried once by pg-boss, 15 minutes later. A failed first attempt sends no `/fail`; the retry's success ping clears the monitor, and only the last attempt failing alerts. The decision uses the `retryLimit` and `retryCount` that pg-boss puts on the job, so the queue must be registered with `boss.work(QUEUE_NAME, { includeMetadata: true }, handler)`. Without that every failure is reported, which is safe but pages on the first attempt. Changing a queue's `retryLimit` in `QUEUE_OPTIONS` does not reach an existing queue (`createQueue` keeps the stored row); use `boss.updateQueue()` for that. The new limit applies to the jobs created after the update; the ones already queued keep theirs, and the wrapper follows them.
- **Per-minute jobs are throttled.** `minIntervalMs: 300000` reports a success at most once per 5 minutes (failures always, and a failure lets the next success through at once), so set that monitor's period to 5 minutes. A job that did not report, because the monitor was down, retries on the next run.

A run that does nothing still counts as a success: `bot-outbox` skipping because a generation run holds the lock pings normally. The heartbeat answers "is the worker alive", not "is the backlog empty"; the per-run log lines answer the second question.

## Adding a scheduled job

1. Add `heartbeats.<jobKey>: process.env.HEARTBEAT_<JOB>_URL` to `config/custom.js`.
2. In the queue service, export `HEARTBEAT = { name, getUrl: () => sails.config.custom.heartbeats.<jobKey> }` (add `minIntervalMs` for a job that runs more than once every few minutes, and register the worker with `{ includeMetadata: true }` for a queue that retries) and end the file with:

   ```javascript
   module.exports.processJob = withHeartbeat(
     module.exports.processJob,
     module.exports.HEARTBEAT
   );
   ```

3. Add the job to `test/integration/1_services/JobHeartbeats.test.js` and to the table above.
4. In the PR, ask for the monitor to be created (see below).

## Setting up a monitor

1. In Better Stack, create a **heartbeat** monitor named after the job, with the period and grace from the table. Period = how often the job reports, grace about twice the run time. Alerts go to the same people as the `/health` monitor.
2. Copy its URL into the App Service setting named in the table (Azure portal or `az webapp config appsettings set`). Type it yourself, or paste it from the portal: the token must not go through a chat, a commit or a shell history.
3. Saving an App Service setting restarts the app, which is enough for the new value to be read.
4. Check the monitor turns green after the next run. To test a failure without waiting, open `<url>/fail` in a browser tab: a `curl` would leave the token in the shell history.
