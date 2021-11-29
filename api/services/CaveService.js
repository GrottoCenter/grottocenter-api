module.exports = {
  /**
   * @param {Object} caves caves to set
   *
   * @returns {Promise} the caves with their attribute "entrances" completed
   */
  setEntrances: async (caves) => {
    return Promise.all(
      caves.map(async (cave) => {
        cave.entrances = await TEntrance.find().where({
          cave: cave.id,
        });
        return cave;
      }),
    );
  },

  /**
   *
   * @param {Object} cleanedData cave-only related data
   * @param {Object} nameData name data (should contain an author, text and language attributes)
   * @param {Array[Object]} [descriptionsData] descriptions data (for each description, should contain an author, title, text and language attributes)
   * @throws Sails ORM errors (see https://sailsjs.com/documentation/concepts/models-and-orm/errors)
   *
   * @returns {Promise} the created cave
   */
  createCave: async (caveData, nameData, descriptionsData) => {
    return await sails.getDatastore().transaction(async (db) => {
      // Create cave
      const createdCave = await TCave.create({
        ...caveData,
      })
        .fetch()
        .usingConnection(db);

      // Format & create name
      await TName.create({
        ...nameData,
        cave: createdCave.id,
        dateInscription: new Date(),
        isMain: true,
      }).usingConnection(db);

      // Format & create descriptions
      descriptionsData
        ? descriptionsData.map(
            async (d) =>
              await TDescription.create({
                ...d,
                cave: createdCave.id,
                dateInscription: new Date(),
              }).usingConnection(db),
          )
        : undefined;

      return createdCave;
    });
  },
};
