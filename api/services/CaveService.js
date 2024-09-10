const CommonService = require('./CommonService');
const DocumentService = require('./DocumentService');
const DescriptionService = require('./DescriptionService');
const NameService = require('./NameService');
const ElasticsearchService = require('./ElasticsearchService');
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

    const populatedCave = await module.exports.getPopulatedCave(res.id);
    module.exports.createESCave(populatedCave).catch(() => {});

    await RecentChangeService.setNameCreate(
      'cave',
      res.id,
      req.token.id,
      nameData.name
    );

    await NotificationService.notifySubscribers(
      req,
      populatedCave,
      req.token.id,
      NotificationService.NOTIFICATION_TYPES.CREATE,
      NotificationService.NOTIFICATION_ENTITIES.CAVE
    );

    return populatedCave;
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
  // TODO Change to use the cave entrances location instead
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

  async getPopulatedCave(caveId, subEntitiesWhere = {}) {
    const cave = await TCave.findOne(caveId)
      .populate('author')
      .populate('reviewer')
      .populate('names')
      .populate('descriptions')
      .populate('entrances')
      .populate('documents');

    if (!cave) return null;

    [cave.massifs, cave.descriptions, cave.documents] = await Promise.all([
      module.exports.getMassifs(cave.id),
      DescriptionService.getCaveDescriptions(cave.id, subEntitiesWhere),
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

  async createESCave(populatedCave) {
    const description =
      populatedCave.descriptions.length === 0
        ? null
        : `${populatedCave.descriptions[0].title} ${populatedCave.descriptions[0].body}`;
    await ElasticsearchService.create('caves', populatedCave.id, {
      id: populatedCave.id,
      depth: populatedCave.depth,
      length: populatedCave.length,
      is_diving: populatedCave.isDiving,
      temperature: populatedCave.temperature,
      name: populatedCave.name,
      names: populatedCave.names.map((n) => n.name).join(', '),
      'nb entrances': populatedCave.entrances.length,
      deleted: populatedCave.isDeleted,
      descriptions: [description],
      tags: ['cave'],
    });
  },

  async permanentlyDeleteCave(cave, shouldMergeInto, mergeIntoId) {
    await TCave.update({ redirectTo: cave.id }).set({
      redirectTo: shouldMergeInto ? mergeIntoId : null,
    });
    await TNotification.destroy({ cave: cave.id });

    if (cave.documents.length > 0) {
      if (shouldMergeInto) {
        const newDocuments = cave.documents.map((e) => e.id);
        await TCave.addToCollection(mergeIntoId, 'documents', newDocuments);
      }
      await HDocument.update({ cave: cave.id }).set({ cave: null });
      await TCave.updateOne(cave.id).set({ documents: [] });
    }

    if (cave.entrances.length > 0 && shouldMergeInto) {
      const newEntrances = cave.entrances.map((e) => e.id);
      await TCave.addToCollection(mergeIntoId, 'entrances', newEntrances);
    }
    await HEntrance.update({ cave: cave.id }).set({ cave: null });

    if (cave.descriptions.length > 0) {
      if (shouldMergeInto) {
        await TDescription.update({ cave: cave.id }).set({
          cave: mergeIntoId,
        });
        await HDescription.update({ cave: cave.id }).set({
          cave: mergeIntoId,
        });
      } else {
        await TDescription.destroy({ cave: cave.id }); // TDescription first soft delete
        await HDescription.destroy({ cave: cave.id });
        await TDescription.destroy({ cave: cave.id });
      }
    }

    await NameService.permanentDelete({ cave: cave.id });

    await HCave.destroy({ id: cave.id });
    await TCave.destroyOne({ id: cave.id }); // Hard delete
  },
};
