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

The pg_cron jobs of `sql/1_cron.sql` are reported by a pg-boss job, see [pg_cron jobs](#pg_cron-jobs) below.

## How it works

`api/utils/heartbeat.js` exports `withHeartbeat(handler, { name, getUrl, minIntervalMs })`. The wrapped handler pings `<url>` when it returns and `<url>/fail` when it throws; the error is rethrown unchanged.

- **It never affects the job.** A missing or invalid URL, a timeout (5 s) or an unreachable monitor is logged as a warning and swallowed.
- **The URL is a secret.** It carries the monitor's token: it is never logged, and only an `https` URL of plain characters is accepted.
- **Unset means unmonitored.** Dev and tests set no URL, so nothing is sent.
- **Retries are not reported.** `db-export` and `search-reconcile` are retried once by pg-boss, 15 minutes later. A failed first attempt sends no `/fail`; the retry's success ping clears the monitor, and only the last attempt failing alerts. The decision uses the `retryLimit` and `retryCount` that pg-boss puts on the job, so the queue must be registered with `boss.work(QUEUE_NAME, { includeMetadata: true }, handler)`. Without that every failure is reported, which is safe but pages on the first attempt. Changing a queue's `retryLimit` in `QUEUE_OPTIONS` does not reach an existing queue (`createQueue` keeps the stored row); use `boss.updateQueue()` for that. The new limit applies to the jobs created after the update; the ones already queued keep theirs, and the wrapper follows them.
- **Per-minute jobs are throttled.** `minIntervalMs: 300000` reports a success at most once per 5 minutes (failures always, and a failure lets the next success through at once), so set that monitor's period to 5 minutes. A job that did not report, because the monitor was down, retries on the next run.

A run that does nothing still counts as a success: `bot-outbox` skipping because a generation run holds the lock pings normally. The heartbeat answers "is the worker alive", not "is the backlog empty"; the per-run log lines answer the second question.

## pg_cron jobs

pg_cron cannot make HTTP calls (and Azure Flexible Server has no `pg_net`), so the cron jobs of `sql/1_cron.sql` cannot ping a monitor themselves. `cron-heartbeat` (`CronHeartbeatQueueService`) runs every day at **05:30 UTC**, after the 04:20-04:50 window (the data quality refresh takes about 45 minutes), reads the latest run of each cron job and pings **one monitor for all of them**: the free Better Stack plan allows ten.

| Job                      | Schedule (UTC)                 | Env var                   | Monitor period | Grace   |
| ------------------------ | ------------------------------ | ------------------------- | -------------- | ------- |
| `cron-heartbeat` (all 6) | every day at 05:30 (the check) | `HEARTBEAT_CRON_JOBS_URL` | 1 day          | 2 hours |

The jobs it covers are listed in `CRON_JOBS` (`api/utils/cronHeartbeat.js`): bibliographic metadata view (daily 03:40), data quality view (daily 04:20), bot outbox trim (daily 04:30), massif, country and region info views (every 3 days, 04:40 / 04:45 / 04:50).

- **Success ping:** every job's last finished run succeeded and is recent (12 hours for a daily job, so that yesterday's run is not taken for today's; 84 hours for an every-3-days job, so that a missed run is noticed up to a day late).
- **`/fail` ping:** as soon as one job's last run failed, never ran, is too old, is not scheduled any more, or has been going for more than 3 hours. The monitor does not say which one: the API log does (`cron-heartbeat: "<job>" (fail): <reason>`, a warning).
- **A run still in progress** (the others are fine): nothing is sent yet. The check throws, and pg-boss runs it again every 10 minutes (`retryLimit` 11, so the last attempt is at about 07:20), which is inside the monitor's 2 hour grace after the 05:30 ping. A test keeps the retries shorter than the grace: raise the grace before lengthening them. When the run has finished, the next attempt sends the success ping. If it is still going on the last attempt, the check sends `/fail`. A job failing elsewhere still sends `/fail` at once.
- **The check itself failing** (database unreachable, function missing) throws and is retried every 10 minutes until about 07:20. If every attempt fails it pings nothing, so the monitor alerts when its grace runs out. That is deliberate: the check does not report itself.
- **Names matter.** A job is matched on the name given to `cron.schedule_in_database`. A test fails when `sql/1_cron.sql` and `CRON_JOBS` differ, so a new or renamed cron job needs a `CRON_JOBS` entry.
- **Where the history comes from.** pg_cron lives in the `postgres` database, so the job opens a short-lived second connection to it (same server and credentials as the API). `cron.job` and `cron.job_run_details` have row-level security (`username = CURRENT_USER`): a role only sees the jobs it owns, and the jobs belong to the admin role (`grottoce` in prod), not to `gc_app`. A grant on the `cron` schema is therefore not enough: `gc_app` calls `public.gc_cron_latest_runs()`, a `SECURITY DEFINER` function in `postgres` that returns four columns of each job's latest run (`sql/9_44_2026_11_26_cron_read_for_api.sql`). It must be created by the role that owns the jobs.
- **History size.** pg_cron never trims `cron.job_run_details`. Six jobs add about 2,200 rows a year, which the function's query handles without an index.

## Adding a scheduled job

Whatever the kind of job, **its PR ships its monitoring**. Tests catch a pg-boss job without a heartbeat test or config key, a drift between `sql/1_cron.sql` and `CRON_JOBS`, and going over the heartbeat limit; the other steps are on you.

**Free plan: 10 heartbeats.** Better Stack's free plan allows ten, and 8 are used (the 6 pg-boss jobs above, the one for all the pg_cron jobs, and the AI VM backup). A new **pg-boss** job takes one. A new **pg_cron** job takes none: it joins the existing `cron-jobs` monitor. A test fails when the count goes over ten; if it does, group jobs (as the cron jobs are) or upgrade the plan.

### A pg-boss job (a `*QueueService` that calls `boss.schedule`)

1. Add `heartbeats.<jobKey>: process.env.HEARTBEAT_<JOB>_URL` to `config/custom.js`.
2. In the queue service, export `HEARTBEAT = { name, getUrl: () => sails.config.custom.heartbeats.<jobKey> }` (add `minIntervalMs` for a job that runs more than once every few minutes, and register the worker with `{ includeMetadata: true }` for a queue that retries) and end the file with:

   ```javascript
   module.exports.processJob = withHeartbeat(
     module.exports.processJob,
     module.exports.HEARTBEAT
   );
   ```

3. Add the job to `test/integration/1_services/JobHeartbeats.test.js` (a test fails for any service that schedules a job and is not listed there) and to the table at the top of this page.
4. Outside this repository, in the private infrastructure repository (`betterstack/`): add the job's row to both status page CSVs and to the README table, see its README.
5. In the PR, ask for the monitor to be created and its URL set (see below).

### A pg_cron job (`sql/1_cron.sql`)

1. Add the job to `sql/1_cron.sql`. Its name (the first argument of `cron.schedule_in_database`) is its identity: a rename is a new job.
2. Add `{ jobname, maxAgeMs }` to `CRON_JOBS` in `api/utils/cronHeartbeat.js`: 12 hours for a daily job, the longest gap between two runs plus half a day for any other. A test fails when `sql/1_cron.sql` and `CRON_JOBS` differ.
3. Mind the check time: `cron-heartbeat` runs at 05:30 UTC (`CRON` in `CronHeartbeatQueueService`). A job that can still be running then, or that is scheduled after it, needs the time moved, and a job running more than 3 hours is reported as stuck.
4. Add the job to the list under [pg_cron jobs](#pg_cron-jobs) and to the explanation of the `cron-jobs` row in both status page CSVs of the private infrastructure repository (`betterstack/`). No new monitor is needed.
5. A migration that touches the cron jobs runs in the `postgres` database and by the role that owns them (see `sql/9_44_2026_11_26_cron_read_for_api.sql`).

## Setting up a monitor

1. In Better Stack, create a **heartbeat** monitor named after the job, with the period and grace from the table. Period = how often the job reports, grace about twice the run time. Alerts go to the same people as the `/health` monitor.
2. Copy its URL into the App Service setting named in the table (Azure portal or `az webapp config appsettings set`). Type it yourself, or paste it from the portal: the token must not go through a chat, a commit or a shell history.
3. Saving an App Service setting restarts the app, which is enough for the new value to be read.
4. Check the monitor turns green after the next run. To test a failure without waiting, open `<url>/fail` in a browser tab: a `curl` would leave the token in the shell history.
