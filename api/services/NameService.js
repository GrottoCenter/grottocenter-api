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
    const namesByEntity = new Map();
    for (const name of allNames) {
      const key = name[entitiesType];
      if (!namesByEntity.has(key)) namesByEntity.set(key, []);
      namesByEntity.get(key).push(name);
    }
    for (const entity of entitiesToComplete) {
      entity.names = namesByEntity.get(entity.id) || [];
      extractMainName(entity);
    }

    if (entitiesType !== 'cave') return entitiesToComplete;

    // Cave → entrance name fallback:
    // Some caves have no TName rows of their own because they were created
    // through an entrance-first workflow where only the entrance received a
    // name. In the Grottocenter domain model a single-entrance cave shares
    // its identity with that entrance, so we fall back to the entrance's
    // name when the cave itself has none.
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

  /**
   * Hard-delete name rows matching `where`.
   *
   * Waterline uses a two-phase destroy for models with `is_deleted`:
   *   1st destroy() → sets is_deleted = true (soft delete)
   *   2nd destroy() → removes the row (hard delete)
   *
   * h_name rows are intentionally preserved for auditability.
   * HName.destroy() via Waterline silently fails anyway (composite PK),
   * but we explicitly skip it to make the intent clear.
   */
  async permanentDelete(where) {
    await TName.destroy(where); // Soft delete (is_deleted = true)
    await TName.destroy(where); // Hard delete (removes row)
  },
};

/* eslint-enable no-param-reassign */
