# Code Review: Async CSV Import Queue

6 commits on `feat/async-csv-import-queue`

## Critical / Bugs

### 1. Race condition in `checkBatchCompletion`

`processOneChunk` returns the result to pg-boss (which marks the job as `completed`), but *before* that return, it calls `checkBatchCompletion`. At that point, the current job's state in the `pgboss.job` table may still be `active` (pg-boss hasn't committed the state change yet because the handler hasn't returned). This means `allDone` will often be `false` even when the current chunk is the last one, causing the batch to never aggregate.

```js
// CSVImportQueueService.js — processOneChunk
await module.exports.checkBatchCompletion(batchId);
return result;  // ← pg-boss updates state to 'completed' only AFTER this returns
```

**Fix:** Use pg-boss `onComplete` handler to trigger completion checks after the job state is committed.

### 2. `processOneChunk` doesn't return result on all paths

The eslint disable comment masks that if an early unhandled error were to occur, the function would return `undefined`. More importantly, pg-boss expects the return value to be stored as `output` on the job row — if the function throws, that output is lost. The `catch` is per-row but there's no outer try/catch around the entire function. If `checkBatchCompletion` itself throws, the job will fail without a meaningful result.

**Fix:** Wrap the entire `processOneChunk` body in a try/catch that always returns `result`.

## Medium Issues

### 3. Duplicate `ENTRANCE_MANDATORY_COLUMNS` definition

The constant is defined both in `import-rows.js` (controller) and `CSVImportQueueService.js`. If they diverge, the fast-fail in the controller won't match what the worker validates.

**Fix:** Extract to `api/utils/csvHelper.js`.

### 4. No `updatedAt` column on `t_job_batch`

The model uses `autoCreatedAt` for `createdAt` but doesn't define `updatedAt`. By default, Waterline adds `updatedAt` to every model unless `autoUpdatedAt: false` is explicitly set. This means Waterline will try to set an `updated_at` column that doesn't exist in the SQL migration, which will cause errors on `.updateOne().set(...)`.

**Fix:** Either add `updated_at timestamp` to the SQL migration, or add `autoUpdatedAt: false` to the model definition.

### 5. TNotification `jobBatch` association is a plain string, not a model reference

The `jobBatch` field on `TNotification` is `type: 'string'` rather than `model: 'TJobBatch'`. This works at the DB level (the FK is in the migration SQL), but Waterline won't know about the association, so you can't `.populate('jobBatch')` on notification queries.

**Fix:** Keep as-is if populate is not needed; otherwise change to `model: 'TJobBatch'`.

### 6. `NotificationService` changes may be dead code

`sendNotificationEmail` maps notification types to action verbs for templating. But `CSVImportQueueService.notifyCompletion` sends the email directly via `sails.helpers.sendEmail`, bypassing `NotificationService` entirely. The additions to `NotificationService` are never exercised.

**Fix:** Remove dead code from `NotificationService` or route the email through it.

### 7. No graceful shutdown for CSV queue worker

`sails.config.beforeShutdown` only stops `EnrichmentQueueService`. The CSV import worker (registered on the same boss instance) has no explicit teardown.

**Fix:** Add CSV queue cleanup to the `beforeShutdown` handler, or document that the shared boss `stop()` handles all workers.

## Minor / Style

### 8. `res.status(202).json(...)` bypasses ControllerService

The project convention is to use `ControllerService.treat` or `ControllerService.treatAndConvert` for success paths. The controller uses raw Express `res.status(202).json(...)`.

**Fix:** Use `ControllerService` if it supports custom status codes, otherwise document the exception.

### 9. Swagger path prefix

Verify that the swagger `servers.url` base already includes `/api/v1` — the new paths are defined without it.

### 10. `Job/find.test.js` stubs `getBatchProgress` globally

The stub is set up once with a fixed response for all tests. This is fragile if controller logic changes.

**Fix:** Use per-test stubs or reset between tests.

### 11. Removed integration coverage

The existing `import-rows.test.js` removed all synchronous import tests (duplicate detection, actual DB creation). These covered real integration paths.

**Fix:** Reimplement as tests for `processOneChunk` or as a separate worker integration test.
