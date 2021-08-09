const ramda = require('ramda');

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
   * @param {Object} cleanedData the struct that contains the necessary data to create a cave
   * @param {Object} nameAndDescData the struct that contains the necessary data to create a name and a description (if there is any)
   * @param {Function} errorHandler callback that is called whenever an error occured. Take an Error as parameter. See https://sailsjs.com/documentation/concepts/models-and-orm/errors for mor information.
   *
   * @returns {Promise} the created cave
   */
  createCave: async (cleanedData, nameAndDescData, errorHandler) => {
    return await sails
      .getDatastore()
      .transaction(async (db) => {
        const caveCreated = await TCave.create(cleanedData)
          .fetch()
          .usingConnection(db);
        if (ramda.propOr(null, 'name', nameAndDescData)) {
          await TName.create({
            author: nameAndDescData.author,
            cave: caveCreated.id,
            dateInscription: ramda.propOr(
              new Date(),
              'dateInscription',
              nameAndDescData,
            ),
            dateReviewed: ramda.propOr(
              undefined,
              'dateReviewed',
              nameAndDescData,
            ),
            isMain: true,
            language: nameAndDescData.descriptionAndNameLanguage.id,
            name: nameAndDescData.name,
          }).usingConnection(db);
        }

        // Description (if provided)
        if (ramda.propOr(null, 'description', nameAndDescData) !== null) {
          await TDescription.create({
            author: nameAndDescData.author,
            body: nameAndDescData.description,
            cave: caveCreated.id,
            dateInscription: ramda.propOr(
              new Date(),
              'dateInscription',
              nameAndDescData,
            ),
            dateReviewed: ramda.propOr(
              undefined,
              'dateReviewed',
              nameAndDescData,
            ),
            language: nameAndDescData.descriptionAndNameLanguage.id,
            title: nameAndDescData.descriptionTitle,
          }).usingConnection(db);
        }

        return caveCreated;
      })
      .intercept(errorHandler);
  },
};
