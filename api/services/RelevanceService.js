/**
 * ENTITY_CONFIG maps each relevance entity type to its Waterline model
 * and the parent fields that define its scope.
 *
 * Models (TLocation, TDescription, etc.) are Sails globals — no imports needed.
 */
const ENTITY_CONFIG = {
  location: {
    model: 'tlocation',
    parentFields: ['entrance'],
  },
  description: {
    model: 'tdescription',
    parentFields: ['entrance', 'cave', 'massif', 'document'],
  },
  comment: {
    model: 'tcomment',
    parentFields: ['entrance', 'cave'],
  },
  rigging: {
    model: 'trigging',
    parentFields: ['entrance', 'cave'],
  },
  history: {
    model: 'thistory',
    parentFields: ['entrance', 'cave'],
  },
};

function getConfig(entityType) {
  const config = ENTITY_CONFIG[entityType];
  if (!config) {
    const err = new Error(`Invalid entity type: ${entityType}.`);
    err.status = 400;
    throw err;
  }
  return config;
}

function getModel(entityType) {
  const config = getConfig(entityType);
  return sails.models[config.model];
}

module.exports = {
  ENTITY_CONFIG,

  /**
   * Extracts the parent scope from an entity instance.
   *
   * @param {string} entityType - One of 'location', 'description', 'comment', 'rigging', 'history'
   * @param {Object} entity - The entity record
   * @returns {Object} e.g. { entrance: 42 }
   */
  getParentScope(entityType, entity) {
    const config = getConfig(entityType);
    for (const field of config.parentFields) {
      if (entity[field] != null) {
        return { [field]: entity[field] };
      }
    }
    return {};
  },

  /**
   * Computes MAX(relevance) + 1 for the given entity type within the parent scope.
   * Only considers non-deleted entities.
   *
   * @param {string} entityType - One of 'location', 'description', 'comment', 'rigging', 'history'
   * @param {Object} parentFieldValues - e.g. { entrance: 42 }
   * @returns {Promise<number>} The next relevance value (1 if no existing entities)
   */
  async computeNextRelevance(entityType, parentFieldValues) {
    const Model = getModel(entityType);
    // Exclude null relevance: PostgreSQL sorts NULLs first with DESC,
    // causing null + 1 = 1 in JS and colliding with existing relevance=1 items.
    const where = {
      ...parentFieldValues,
      isDeleted: false,
      relevance: { '!=': null },
    };
    const results = await Model.find({
      where,
      select: ['relevance'],
      sort: 'relevance DESC',
      limit: 1,
    });
    if (results.length === 0) {
      return 1;
    }
    return results[0].relevance + 1;
  },

  /**
   * Swaps the relevance of the target entity with its adjacent neighbor.
   *
   * @param {string} entityType - One of 'location', 'description', 'comment', 'rigging', 'history'
   * @param {number} entityId - ID of the entity to move
   * @param {number} direction - 1 (move down / increase relevance) or -1 (move up / decrease relevance)
   * @returns {Promise<{moved: Object, swapped: Object}>} Both entities with updated relevance
   * @throws {Error} With .status property for not-found (404), deleted (400), boundary (400), invalid direction (400)
   */
  async moveRelevance(entityType, entityId, direction) {
    if (direction !== 1 && direction !== -1) {
      const err = new Error('Direction must be 1 or -1.');
      err.status = 400;
      throw err;
    }

    const config = getConfig(entityType);
    const Model = sails.models[config.model];
    const label = entityType.charAt(0).toUpperCase() + entityType.slice(1);

    const target = await Model.findOne({ id: entityId });
    if (!target) {
      const err = new Error(`${label} of id ${entityId} not found.`);
      err.status = 404;
      throw err;
    }
    if (target.isDeleted) {
      const err = new Error(`${label} of id ${entityId} is deleted.`);
      err.status = 400;
      throw err;
    }

    const parentScope = this.getParentScope(entityType, target);

    // Unranked entity: assign a position first, no swap needed.
    if (target.relevance == null) {
      const nextRelevance = await this.computeNextRelevance(
        entityType,
        parentScope
      );
      const moved = await Model.updateOne({ id: entityId }).set({
        relevance: nextRelevance,
      });
      return { moved, swapped: null };
    }

    const where = {
      ...parentScope,
      isDeleted: false,
      id: { '!=': entityId },
      // '>' / '<' comparisons implicitly exclude NULL in PostgreSQL (NULL yields UNKNOWN, not TRUE).
    };

    let sort;
    if (direction === 1) {
      where.relevance = { '>': target.relevance };
      sort = 'relevance ASC';
    } else {
      where.relevance = { '<': target.relevance };
      sort = 'relevance DESC';
    }

    const neighbors = await Model.find({
      where,
      sort,
      limit: 1,
    });

    if (neighbors.length === 0) {
      const err = new Error(
        `${label} of id ${entityId} cannot be moved further in that direction.`
      );
      err.status = 400;
      throw err;
    }

    const neighbor = neighbors[0];

    const { moved, swapped } = await sails
      .getDatastore()
      .transaction(async (db) => {
        const updatedTarget = await Model.updateOne({ id: entityId })
          .set({ relevance: neighbor.relevance })
          .usingConnection(db);
        const updatedNeighbor = await Model.updateOne({ id: neighbor.id })
          .set({ relevance: target.relevance })
          .usingConnection(db);
        return { moved: updatedTarget, swapped: updatedNeighbor };
      });

    return { moved, swapped };
  },
};
