/* eslint-disable no-param-reassign */

const BATCH_SIZE = 3000; // Stay well under PostgreSQL's bind parameter limit

/**
 * Query in batches to avoid exceeding PostgreSQL's bind parameter limit.
 * @param {Function} queryFn - async function that takes an array of ids and returns results
 * @param {Array} ids - full list of ids to query
 * @returns {Promise<Array>} concatenated results from all batches
 */
async function batchQuery(queryFn, ids) {
  if (ids.length <= BATCH_SIZE) return queryFn(ids);
  const results = [];
  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const batch = ids.slice(i, i + BATCH_SIZE);
    // eslint-disable-next-line no-await-in-loop
    const batchResults = await queryFn(batch);
    results.push(...batchResults);
  }
  return results;
}

function extractMainName(entity) {
  const mainName = entity.names.find((n) => n.isMain);
  if (mainName) entity.name = mainName.name;
}

module.exports = {
  /**
   * @param {[string]} entitiesToComplete collection of entities for which we want the names
   * @param {string} entitiesType should be one of: cave, entrance, grotto, massif, point
   *
   * @returns {Promise} the entities with their attribute "names" completed
   */
  setNames: async (entitiesToComplete, entitiesType) => {
    if (!entitiesToComplete) return null;

    const allIds = entitiesToComplete.map((e) => e.id);
    const allNames = await batchQuery(
      (ids) => TName.find().where({ [entitiesType]: ids }),
      allIds
    );
    for (const entity of entitiesToComplete) {
      entity.names = allNames.filter((n) => n[entitiesType] === entity.id);
      extractMainName(entity);
    }

    if (entitiesType !== 'cave') return entitiesToComplete;
    // For a cave, if there is no name for it, search the name
    // of its first entrance (the only one): the name of the cave is the same as its entrance.
    const emptyNameCaves = entitiesToComplete.filter(
      (entity) => entity.names.length === 0
    );
    if (emptyNameCaves.length === 0) return entitiesToComplete;

    const caveIds = emptyNameCaves.map((c) => c.id);
    const entrances = await batchQuery(
      (ids) => TEntrance.find({ cave: ids }).populate('names'),
      caveIds
    );
    for (const cave of emptyNameCaves) {
      cave.names = entrances.find((e) => e.cave === cave.id)?.names ?? [];
      extractMainName(cave);
    }

    return entitiesToComplete;
  },

  async permanentDelete(where) {
    await TName.destroy(where); // TName first soft delete
    await HName.destroy(where);
    await TName.destroy(where); // Hard delete
  },
};

/* eslint-enable no-param-reassign */
