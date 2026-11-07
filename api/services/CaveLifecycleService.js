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
 */
const CommonService = require('./CommonService');

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
 * @param {number} entranceId
 * @param {number} destinationCaveId
 * @param {number} reviewerId
 * @returns {Promise<{notFound: string}|{ok: true, sourceDeleted: boolean}>}
 */
const moveEntranceToCave = async (entranceId, destinationCaveId, reviewerId) =>
  sails.getDatastore().transaction(async (db) => {
    const entrance = await TEntrance.findOne(entranceId).usingConnection(db);
    if (!entrance || entrance.isDeleted) {
      return { notFound: `Entrance of id ${entranceId} not found.` };
    }
    const initialCaveId = entrance.cave;

    await lockCaves([initialCaveId, destinationCaveId], db);
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
    if (!initialCave || initialCave.entrances.length > 0) {
      // The source keeps other entrances: which of its points belong to the
      // moved entrance cannot be inferred, so its scientific data stays.
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
  lockCaves,
  transferScientificData,
  detachScientificData,
  lockCaveForScientificWrite,
  moveEntranceToCave,
};
