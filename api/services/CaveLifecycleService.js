/**
 * Cave lifecycle operations that must keep the scientific data (t_point,
 * t_observation) attached to the right cave (#1982).
 *
 * Rules (docs/scientific-data-lifecycle.md):
 * - moving the last entrance of A to B transfers A's points and observations
 *   to B, then soft-deletes A with a redirect to B;
 * - moving an entrance while A keeps other entrances leaves them on A;
 * - permanently merging A into B transfers them to B before A is deleted;
 * - permanently deleting A without a target detaches them (id_cave = NULL);
 * - a soft delete leaves them untouched, so a restore finds them back.
 *
 * Soft-deleted points and observations are moved or detached too: their rows
 * still reference the cave and would block its physical deletion.
 *
 * Locking: every operation locks the caves it changes FOR UPDATE, and every
 * writer of a scientific cave reference locks the cave it references with
 * lockCaveForScientificWrite() (FOR SHARE) and refuses a deleted one. Either
 * the writer commits first and its reference is moved with the others, or it
 * waits for the operation and then finds the cave deleted or gone.
 *
 * Lock order: caves first (in id order), then the entrance, then points.
 * Every lifecycle operation and every writer follows it, so that no two of
 * them can wait for each other. An operation that only knows which cave to
 * lock after reading an unlocked row (an entrance's cave) reads it again
 * under the locks and starts over in a new transaction when it changed
 * (withLockRetry).
 */
const CommonService = require('./CommonService');

const STALE_LOCK = 'E_STALE_LOCK';
const MERGE_TARGET_UNAVAILABLE = 'E_MERGE_TARGET_UNAVAILABLE';
const MAX_LOCK_ATTEMPTS = 5;

const errorWithCode = (code, message) => {
  const err = new Error(message);
  err.code = code;
  return err;
};

/**
 * Whether an error, possibly wrapped by Waterline, carries this code.
 * @param {Error} err
 * @param {string} code
 */
const hasCode = (err, code) => err?.code === code || err?.raw?.code === code;

/**
 * A stale lock error, for a caller that finds that a row it locked after
 * reading it without a lock no longer holds the value it read: thrown in a
 * withLockRetry() transaction, it starts the transaction over.
 * @param {string} message
 */
const staleLockError = (message) => errorWithCode(STALE_LOCK, message);

/**
 * Whether an error is the rejection of an unavailable merge target.
 * @param {Error} err
 */
const isMergeTargetUnavailable = (err) =>
  hasCode(err, MERGE_TARGET_UNAVAILABLE);

/**
 * Run `work(db)` in a transaction, and again in a new one when it throws a
 * stale lock error: the rows it locked no longer match what it read before
 * locking them. Gives up after MAX_LOCK_ATTEMPTS.
 *
 * @param {Function} work async (db) => result
 */
const withLockRetry = async (work, attempt = 1) => {
  try {
    // The callback must be an `async` function: Waterline treats any other
    // function as callback-style and commits even when it rejects.
    return await sails.getDatastore().transaction(async (db) => work(db));
  } catch (err) {
    if (hasCode(err, STALE_LOCK) && attempt < MAX_LOCK_ATTEMPTS) {
      return withLockRetry(work, attempt + 1);
    }
    throw err;
  }
};

/**
 * Lock caves FOR UPDATE, in id order so that two operations on the same pair
 * of caves cannot deadlock.
 * @param {Array<number>} caveIds
 * @param {Object} db transaction connection
 */
const lockCaves = async (caveIds, db) => {
  const ids = [
    ...new Set(caveIds.filter((id) => id !== null && id !== undefined)),
  ]
    .map(Number)
    .sort((a, b) => a - b);
  if (ids.length === 0) return;
  await CommonService.query(
    'SELECT id FROM t_cave WHERE id = ANY($1::int[]) ORDER BY id FOR UPDATE',
    [ids],
    db
  );
};

/**
 * Lock an entrance in the lifecycle lock order: its cave and `otherCaveIds`
 * FOR UPDATE, then the entrance FOR UPDATE. Its cave is read without a lock
 * to know which cave to lock, then read again under the locks; when a
 * concurrent move, merge or delete changed it meanwhile, a stale lock error
 * makes withLockRetry() start over.
 *
 * @param {number} entranceId
 * @param {Array<number>} otherCaveIds caves to lock with the entrance's own
 * @param {Object} db transaction connection
 * @returns {Promise<{caveId: number|null, isDeleted: boolean}|null>} the
 *   entrance as locked, null when it does not exist
 */
const lockEntrance = async (entranceId, otherCaveIds, db) => {
  const read = async (forUpdate) =>
    (
      await CommonService.query(
        `SELECT id_cave, is_deleted FROM t_entrance WHERE id = $1${
          forUpdate ? ' FOR UPDATE' : ''
        }`,
        [entranceId],
        db
      )
    ).rows[0];

  const unlocked = await read(false);
  if (!unlocked) return null;
  await lockCaves([unlocked.id_cave, ...otherCaveIds], db);
  const locked = await read(true);
  if (!locked) return null;
  if (locked.id_cave !== unlocked.id_cave) {
    throw staleLockError(
      `Entrance ${entranceId} moved from cave ${unlocked.id_cave} to ${locked.id_cave} while its caves were being locked.`
    );
  }
  return { caveId: locked.id_cave, isDeleted: locked.is_deleted };
};

/**
 * Check, once the caves are locked, that a merge target can receive what a
 * cave holds: another cave, existing and not deleted. Throws a merge target
 * error (isMergeTargetUnavailable()) otherwise.
 *
 * @param {number} caveId the cave being merged
 * @param {number} mergeIntoId
 * @param {Object} db transaction connection, holding the lock on the target
 */
const assertMergeTargetAvailable = async (caveId, mergeIntoId, db) => {
  const unavailable = () =>
    errorWithCode(
      MERGE_TARGET_UNAVAILABLE,
      `Cave of id ${caveId} cannot be merged into cave ${mergeIntoId}: the target must be another existing, non-deleted cave.`
    );
  if (
    !Number.isInteger(Number(mergeIntoId)) ||
    Number(mergeIntoId) === Number(caveId)
  ) {
    throw unavailable();
  }
  const { rows } = await CommonService.query(
    'SELECT id FROM t_cave WHERE id = $1 AND is_deleted = false',
    [mergeIntoId],
    db
  );
  if (rows.length === 0) throw unavailable();
};

/**
 * Move every scientific reference of a cave to another one, soft-deleted
 * points and observations included. Point and observation ids, links,
 * coordinates and denormalized snapshot fields (cave_name) are kept.
 *
 * @returns {Promise<{points: number, observations: number}>} rows moved
 */
const transferScientificData = async (fromCaveId, toCaveId, db) => {
  const [points, observations] = await Promise.all([
    CommonService.query(
      'UPDATE t_point SET id_cave = $2 WHERE id_cave = $1',
      [fromCaveId, toCaveId],
      db
    ),
    CommonService.query(
      'UPDATE t_observation SET id_cave = $2 WHERE id_cave = $1',
      [fromCaveId, toCaveId],
      db
    ),
  ]);
  return { points: points.rowCount, observations: observations.rowCount };
};

/**
 * Clear the cave reference of every point and observation of a cave,
 * soft-deleted ones included. Nothing else is changed: observations keep
 * their point, points keep their coordinates (or lack of them), and dependent
 * records (time series, measurements, documents) are untouched.
 *
 * @returns {Promise<{points: number, observations: number}>} rows detached
 */
const detachScientificData = async (caveId, db) => {
  const [points, observations] = await Promise.all([
    CommonService.query(
      'UPDATE t_point SET id_cave = NULL WHERE id_cave = $1',
      [caveId],
      db
    ),
    CommonService.query(
      'UPDATE t_observation SET id_cave = NULL WHERE id_cave = $1',
      [caveId],
      db
    ),
  ]);
  return { points: points.rowCount, observations: observations.rowCount };
};

/**
 * Lock a cave a point or an observation is about to reference, and check it
 * can still receive one. Must run on the writer's transaction, before the
 * write.
 *
 * @param {number} caveId
 * @param {Object} db transaction connection
 * @returns {Promise<boolean>} true when the cave exists and is not deleted
 */
const lockCaveForScientificWrite = async (caveId, db) => {
  const result = await CommonService.query(
    'SELECT id FROM t_cave WHERE id = $1 AND is_deleted = false FOR SHARE',
    [caveId],
    db
  );
  return result.rows.length === 1;
};

/**
 * Move an entrance to another cave, in one transaction. When the entrance was
 * the last one of its cave, the cave's scientific data is transferred to the
 * destination and the cave is soft-deleted with a redirect to it.
 *
 * The source is the entrance's cave read under the locks (lockEntrance()):
 * two overlapping moves of the same entrance are serialized, and the second
 * one starts from the cave the first one moved it to.
 *
 * @param {number} entranceId
 * @param {number} destinationCaveId
 * @param {number} reviewerId
 * @returns {Promise<{notFound: string}|{ok: true, sourceDeleted: boolean}>}
 */
const moveEntranceToCave = async (entranceId, destinationCaveId, reviewerId) =>
  withLockRetry(async (db) => {
    const entrance = await lockEntrance(entranceId, [destinationCaveId], db);
    if (!entrance || entrance.isDeleted) {
      return { notFound: `Entrance of id ${entranceId} not found.` };
    }
    const initialCaveId = entrance.caveId;

    const destinationCave =
      await TCave.findOne(destinationCaveId).usingConnection(db);
    if (!destinationCave || destinationCave.isDeleted) {
      return { notFound: `Cave of id ${destinationCaveId} not found.` };
    }

    // Single update — produces one h_entrance snapshot (old cave → new cave)
    await TEntrance.updateOne({ id: entranceId })
      .set({ cave: destinationCaveId, reviewer: reviewerId })
      .usingConnection(db);

    // An entrance without a cave (legacy orphan) has no initial cave to clean
    // up, and moving an entrance to its own cave changes nothing.
    if (!initialCaveId || initialCaveId === destinationCaveId) {
      return { ok: true, sourceDeleted: false };
    }

    const initialCave = await TCave.findOne(initialCaveId)
      .populate('entrances')
      .usingConnection(db);
    // The source keeps other entrances: which of its points belong to the
    // moved entrance cannot be inferred, so its scientific data stays. An
    // already deleted source keeps its data for a restore, and must not be
    // destroyed again: the production trigger turns a second delete into a
    // physical one.
    if (
      !initialCave ||
      initialCave.isDeleted ||
      initialCave.entrances.length > 0
    ) {
      return { ok: true, sourceDeleted: false };
    }

    const moved = await transferScientificData(
      initialCaveId,
      destinationCaveId,
      db
    );
    sails.log.info(
      `Entrance ${entranceId} moved from cave ${initialCaveId} to ${destinationCaveId}: transferred ${moved.points} point(s) and ${moved.observations} observation(s)`
    );
    await TCave.update(initialCaveId)
      .set({ redirectTo: destinationCaveId })
      .usingConnection(db);
    await TCave.destroyOne({ id: initialCaveId }).usingConnection(db); // Soft delete
    return { ok: true, sourceDeleted: true };
  });

module.exports = {
  withLockRetry,
  staleLockError,
  isMergeTargetUnavailable,
  lockCaves,
  lockEntrance,
  assertMergeTargetAvailable,
  transferScientificData,
  detachScientificData,
  lockCaveForScientificWrite,
  moveEntranceToCave,
};
