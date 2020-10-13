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

        // For a cave, if there is no name for it, search the name of its first entrance (the only one):
        //    the name of the cave is the same as its entrance.
        if (Array.isArray(entity.names) && entity.names.length === 0) {
          if (entitiesType === 'cave') {
            entity.names = await TName.find().where({
              entrance: entity.entrances[0].id,
            });
          }
        }
        const mainName = entity.names.find((n) => n.isMain);
        if (mainName) {
          entity.name = mainName.name;
        }
        return entity;
      }),
    );
  },
};
