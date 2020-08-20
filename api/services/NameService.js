module.exports = {
  /**
   * @param {string} entitiesToComplete collection of entities for which we want the names
   * @param {string} entitiesType should be one of: cave, entrance, grotto, massif, point
   *
   * @returns {Promise} the entities with their attribute "names" completed
   */
  setNames: async (entitiesToComplete, entitiesType) => {
    return Promise.all(
      entitiesToComplete.map(async (entity) => {
        entity.names = await TName.find().where({
          [entitiesType]: entity.id,
        });
        return entity;
      }),
    );
  },
};
