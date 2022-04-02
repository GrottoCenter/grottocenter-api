module.exports = {
  /**
   * @param {string} entitiesToComplete collection of entities for which we want the names
   * @param {string} entitiesType should be one of: cave, entrance, grotto, massif, point
   *
   * @returns {Promise} the entities with their attribute "names" completed
   */
  setNames: async (entitiesToComplete, entitiesType) => {
    if (entitiesToComplete) {
      return Promise.all(
        entitiesToComplete.map(async (entity) => {
          // eslint-disable-next-line no-param-reassign
          entity.names = await TName.find().where({
            [entitiesType]: entity.id,
          });

          // For a cave, if there is no name for it, search the name
          // of its first entrance (the only one): the name of the cave is the same as its entrance.
          if (Array.isArray(entity.names) && entity.names.length === 0) {
            if (entitiesType === 'cave') {
              const relatedEntrance = await TEntrance.find({
                cave: entity.id,
              }).limit(1);
              // eslint-disable-next-line no-param-reassign
              entity.names = relatedEntrance[0]
                ? await TName.find().where({
                    entrance: relatedEntrance[0].id,
                  })
                : [];
            }
          }
          const mainName = entity.names.find((n) => n.isMain);
          if (mainName) {
            // eslint-disable-next-line no-param-reassign
            entity.name = mainName.name;
          }
          return entity;
        })
      );
    }
    return null;
  },
};
