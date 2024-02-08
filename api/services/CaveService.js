const ramda = require('ramda');
const CommonService = require('./CommonService');
const DocumentService = require('./DocumentService');
const DescriptionService = require('./DescriptionService');
const NameService = require('./NameService');
const ElasticsearchService = require('./ElasticsearchService');
const {
  NOTIFICATION_TYPES,
  NOTIFICATION_ENTITIES,
} = require('./NotificationService');
const NotificationService = require('./NotificationService');
const RecentChangeService = require('./RecentChangeService');

const GET_CUMULATED_LENGTH = `
  SELECT SUM(c.length) as sum_length, COUNT(c.length) as nb_data
  FROM t_entrance e
  JOIN t_cave c ON e.id_cave = c.id
  WHERE c.length IS NOT NULL
  AND c.is_deleted = false
  AND e.is_deleted = false
`;

module.exports = {
  /**
   * @param {Array<Object>} caves caves to set
   *
   * @returns {Promise} the caves with their attribute "entrances" completed
   */
  setEntrances: async (caves) => {
    const entrances = await TEntrance.find()
      .where({ cave: { in: caves.map((c) => c.id) } })
      .populate('names');
    for (const cave of caves) {
      cave.entrances = entrances.filter((e) => e.cave === cave.id);
    }
  },

  /**
   *
   * @param {Object} req
   * @param {Object} cleanedData cave-only related data
   * @param {Object} nameData name data (should contain an author, text and language attributes)
   * @param {Array[Object]} [descriptionsData] descriptions data (for each description,
   *  should contain an author, title, text and language attributes)
   * @throws Sails ORM errors (see https://sailsjs.com/documentation/concepts/models-and-orm/errors)
   *
   * @returns {Promise} the created cave
   */
  createCave: async (req, caveData, nameData, descriptionsData) => {
    const res = await sails.getDatastore().transaction(async (db) => {
      // Create cave
      const createdCave = await TCave.create({ ...caveData })
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

    module.exports.setEntrances([res]);

    await RecentChangeService.setNameCreate(
      'cave',
      res.id,
      req.token.id,
      nameData.name
    );

    await NotificationService.notifySubscribers(
      req,
      res,
      req.token.id,
      NOTIFICATION_TYPES.CREATE,
      NOTIFICATION_ENTITIES.CAVE
    );

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

      sails.log.info(`Deleting cave with id ${sourceCaveId}`);
      await TCave.destroy(sourceCaveId).usingConnection(db);
      await ElasticsearchService.deleteResource('caves', sourceCaveId);
    });
  },

  // Extract everything from the request body except id and dateInscription
  getConvertedDataFromClient: (req) => ({
    // The TCave.create() function doesn't work with TCave field alias. See TCave.js Model
    depth: req.param('depth'),
    documents: req.param('documents'),
    isDiving: req.param('isDiving'),
    latitude: req.param('latitude'),
    longitude: req.param('longitude'),
    caveLength: req.param('length'),
    massif: req.param('massif'),
    temperature: req.param('temperature'),
  }),

  /**
   * Get the massifs in which the cave is contained.
   * If there is none, return an empty array.
   * @param {*} caveId
   * @returns [Massif]
   */
  getMassifs: async (caveId) => {
    try {
      const WGS84_SRID = 4326; // GPS
      const query = `
      SELECT m.*
      FROM t_massif as m
      JOIN  t_cave AS c
      ON ST_Contains(ST_SetSRID(m.geog_polygon::geometry, ${WGS84_SRID}), ST_SetSRID(ST_MakePoint(c.longitude, c.latitude), ${WGS84_SRID}))
      WHERE c.id = $1
    `;
      const queryResult = await CommonService.query(query, [caveId]);
      return queryResult.rows;
    } catch (e) {
      // Fail silently (happens when the longitude and latitude are null for example)
      return [];
    }
  },

  deleteCave: async (req, caveId) => {
    sails.log.info(`Deleting cave with id ${caveId}`);
    const cave = await TCave.findOne(caveId);
    await TCave.destroyOne(Number(caveId));
    await ElasticsearchService.deleteResource('caves', caveId);
    await NotificationService.notifySubscribers(
      req,
      cave,
      req.token.id,
      NOTIFICATION_TYPES.DELETE,
      NOTIFICATION_ENTITIES.CAVE
    );
  },

  /**
   *
   * @param
   * @returns {Object} the cumulated length of the caves present in the database whose value length is not null
   *                and the number of data on which this value is calculated
   *                or null if no result or something went wrong
   */
  getCumulatedLength: async () => {
    try {
      const queryResult = await CommonService.query(GET_CUMULATED_LENGTH, []);
      const result = queryResult.rows;
      if (result.length > 0) {
        return result[0];
      }
      return null;
    } catch (e) {
      return null;
    }
  },

  async getCavePopulated(documentId) {
    const cave = await TCave.findOne(documentId)
      .populate('descriptions')
      .populate('entrances')
      .populate('author')
      .populate('reviewer')
      .populate('names')
      .populate('documents');

    if (!cave) return null;
    if (cave.isDeleted) return cave;

    [cave.massifs, cave.descriptions, cave.documents] = await Promise.all([
      module.exports.getMassifs(cave.id),
      DescriptionService.getCaveDescriptions(cave.id),
      DocumentService.getDocuments(cave.documents?.map((d) => d.id) ?? []),
    ]);

    const nameAsyncArr = [
      NameService.setNames(cave?.entrances, 'entrance'),
      NameService.setNames(cave?.massifs, 'massif'),
    ];
    if (cave.names.length === 0) {
      // As the name service will also get the entrance name if needed
      nameAsyncArr.push(NameService.setNames([cave], 'cave'));
    }
    await Promise.all(nameAsyncArr);

    // TODO What about other linked entities ?
    // - histories
    // - riggings
    // - comments
    // - exploringGrottos
    // - partneringGrottos

    return cave;
  },
};
