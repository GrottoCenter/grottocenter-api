const ramda = require('ramda');
const CommonService = require('./CommonService');

module.exports = {
  /**
   * @param {Object} caves caves to set
   *
   * @returns {Promise} the caves with their attribute "entrances" completed
   */
  setEntrances: async (caves) => {
    const entrances = await TEntrance.find()
      .where({
        cave: {
          in: caves.map((c) => c.id),
        },
      })
      .populate('names');
    for (const cave of caves) {
      cave.entrances = entrances.filter((e) => e.cave === cave.id);
    }
  },

  /**
   *
   * @param {Object} cleanedData cave-only related data
   * @param {Object} nameData name data (should contain an author, text and language attributes)
   * @param {Array[Object]} [descriptionsData] descriptions data (for each description,
   *  should contain an author, title, text and language attributes)
   * @throws Sails ORM errors (see https://sailsjs.com/documentation/concepts/models-and-orm/errors)
   *
   * @returns {Promise} the created cave
   */
  createCave: async (caveData, nameData, descriptionsData) => {
    const res = await sails.getDatastore().transaction(async (db) => {
      // Create cave
      const createdCave = await TCave.create(caveData)
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
      if (descriptionsData) {
        descriptionsData.map(async (d) => {
          const desc = await TDescription.create({
            ...d,
            cave: createdCave.id,
            dateInscription: new Date(),
          }).usingConnection(db);
          return desc;
        });
      }
      return createdCave;
    });
    return res;
  },

  /**
   * Merge a source cave into a destination cave (no checks performed)
   * @param {*} req
   * @param {*} res
   * @param {*} sourceCaveId cave id to be merged into destinationCave
   * @param {*} destinationCaveId cave id which will receive sourceCaveId data
   * @throws Sails ORM errors (see https://sailsjs.com/documentation/concepts/models-and-orm/errors)
   */
  mergeCaves: async (sourceCaveId, destinationCaveId) => {
    await sails.getDatastore().transaction(async (db) => {
      // Delete sourceCave names
      await TName.destroy({ cave: sourceCaveId }).usingConnection(db);

      // Move associated data
      await TComment.update({ cave: sourceCaveId })
        .set({ cave: destinationCaveId })
        .usingConnection(db);
      await TDescription.update({ cave: sourceCaveId })
        .set({ cave: destinationCaveId })
        .usingConnection(db);
      await TDocument.update({ cave: sourceCaveId })
        .set({ cave: destinationCaveId })
        .usingConnection(db);
      await TEntrance.update({ cave: sourceCaveId })
        .set({ cave: destinationCaveId })
        .usingConnection(db);
      await THistory.update({ cave: sourceCaveId })
        .set({ cave: destinationCaveId })
        .usingConnection(db);

      // Handle many-to-many relationships
      const sourceCave = await TCave.findOne(sourceCaveId)
        .populate('exploringGrottos')
        .populate('partneringGrottos')
        .usingConnection(db);
      const destinationCave = await TCave.findOne(destinationCaveId)
        .populate('exploringGrottos')
        .populate('partneringGrottos')
        .usingConnection(db);

      const {
        exploringGrottos: sourceExplorers,
        partneringGrottos: sourcePartners,
      } = sourceCave;
      const {
        exploringGrottos: destinationExplorers,
        partneringGrottos: destinationPartners,
      } = destinationCave;

      // Update explored / partner caves only if not already explored / partner
      // by the destination cave.
      for (const sourceExp of sourceExplorers) {
        if (!destinationExplorers.some((g) => g.id === sourceExp.id)) {
          // eslint-disable-next-line no-await-in-loop
          await TCave.addToCollection(
            destinationCaveId,
            'exploringGrottos',
            sourceExp.id
          ).usingConnection(db);
        }
      }
      for (const sourcePartn of sourcePartners) {
        if (!destinationPartners.some((g) => g.id === sourcePartn.id)) {
          // eslint-disable-next-line no-await-in-loop
          await TCave.addToCollection(
            destinationCaveId,
            'partneringGrottos',
            sourcePartn.id
          ).usingConnection(db);
        }
      }

      // Update cave data with destination data being prioritised
      const mergedData = ramda.mergeWith(
        (a, b) => (b === null ? a : b),
        sourceCave,
        destinationCave
      );

      const { id, exploringGrottos, partneringGrottos, ...cleanedMergedData } =
        mergedData;
      await TCave.update(destinationCaveId)
        .set(cleanedMergedData)
        .usingConnection(db);

      await TCave.destroy(sourceCaveId).usingConnection(db);
    });
  },

  // Extract everything from the request body except id and dateInscription
  getConvertedDataFromClient: (req) => ({
    // The TCave.create() function doesn't work with TCave field alias. See TCave.js Model
    date_inscription: new Date(),
    depth: req.param('depth'),
    documents: req.param('documents'),
    id_author: req.token.id,
    id_massif: req.param('massif'),
    is_diving: req.param('isDiving'),
    latitude: req.param('latitude'),
    longitude: req.param('longitude'),
    length: req.param('length'),
    massif: req.param('massif'),
    temperature: req.param('temperature'),
  }),

  getMassifs: async (cave) => {
    const query = `
      SELECT m.*
      FROM t_massif as m
      JOIN  t_cave AS c
      ON ST_Contains(m.geog_polygon, ST_MakePoint(c.longitude, c.latitude) )
      WHERE c.id = $1 
    `;
    const queryResult = await CommonService.query(query, [cave.id]);
    return queryResult.rows;
  },
};
