module.exports = {
  setName: async (entity, entityType) => {
    /* eslint-disable no-param-reassign */
    entity.names = await TName.find().where({ [entityType]: entity.id });

    // For a cave, if there is no name for it, search the name
    // of its first entrance (the only one): the name of the cave is the same as its entrance.
    if (
      entityType === 'cave' &&
      Array.isArray(entity.names) &&
      entity.names.length === 0
    ) {
      const relatedEntrance = await TEntrance.findOne({ cave: entity.id });
      if (relatedEntrance) {
        entity.names = await TName.find().where({
          entrance: relatedEntrance.id,
        });
      }
    }

    const mainName = entity.names.find((n) => n.isMain);
    if (mainName) entity.name = mainName.name;
    return entity;
    /* eslint-enable no-param-reassign */
  },

  /**
   * @param {[string]} entitiesToComplete collection of entities for which we want the names
   * @param {string} entitiesType should be one of: cave, entrance, grotto, massif, point
   *
   * @returns {Promise} the entities with their attribute "names" completed
   */
  setNames: async (entitiesToComplete, entitiesType) => {
    if (!entitiesToComplete) return null;
    return Promise.all(
      entitiesToComplete.map((e) => module.exports.setName(e, entitiesType))
    );
  },
};
