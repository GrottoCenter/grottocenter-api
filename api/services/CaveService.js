const CommonService = require('./CommonService');
const coerceToInt = require('../utils/coerceToInt');
const coerceToNumeric = require('../utils/coerceToNumeric');
const DocumentService = require('./DocumentService');
const DescriptionService = require('./DescriptionService');
const NameService = require('./NameService');
const SearchService = require('./SearchService');
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
    module.exports.updateInSearch(populatedCave);

    await RecentChangeService.setNameCreate(
      'cave',
      res.id,
      req.token.id,
      nameData.name
    );

    await NotificationService.notifySubscribers(
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
    depth: coerceToInt(req.param('depth')),
    documents: req.param('documents'),
    isDiving: req.param('isDiving'),
    latitude: coerceToNumeric(req.param('latitude')),
    longitude: coerceToNumeric(req.param('longitude')),
    caveLength: coerceToInt(req.param('length')),
    massif: req.param('massif'),
    temperature: req.param('temperature'),
  }),

  /**
   * Get the massifs in which the cave is contained.
   * If there is none, return an empty array.
   *
   * Note: this query routes through t_entrance to leverage the GiST index on
   * point_geom. A cave with no entrance will therefore return no massifs, which
   * is acceptable because every cave in the domain model must have at least one
   * entrance.
   *
   * @param {*} caveId
   * @returns [Massif]
   */
  getMassifs: async (caveId) => {
    try {
      const query = `
      SELECT DISTINCT m.*
      FROM t_massif AS m
      JOIN t_entrance AS e ON ST_Contains(m.geog_polygon::geometry, e.point_geom)
      WHERE e.id_cave = $1
      AND e.is_deleted = false
      AND m.is_deleted = false
    `;
      const queryResult = await CommonService.query(query, [caveId]);
      return queryResult.rows;
    } catch (e) {
      // Fail silently (happens when the point_geom is null for example)
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

  /**
   * Get organizations that explored the cave
   * @param {number} caveId
   * @returns {Promise<Array>} Array of organizations with id and name
   */
  getExploringOrganizations: async (caveId) => {
    const query = `
      SELECT g.*
      FROM t_grotto g
             JOIN j_grotto_cave_explorer j ON g.id = j.id_grotto
      WHERE j.id_cave = $1
        AND g.is_deleted = false
    `;
    const result = await CommonService.query(query, [caveId]);
    const grottos = result.rows;

    if (!grottos || grottos.length === 0) {
      return [];
    }

    await NameService.setNames(grottos, 'grotto');
    return grottos;
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
      DocumentService.getDocumentsForCitation(
        cave.documents?.map((d) => d.id) ?? []
      ),
    ]);

    cave.exploringOrganizations =
      await module.exports.getExploringOrganizations(cave.id);

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
    // - partneringGrottos

    return cave;
  },

  async deleteInSearch(caveId) {
    await SearchService.deleteDocument('caves', caveId);
  },

  async updateInSearch(populatedCave) {
    const { names, ...c } = populatedCave;
    const cave = {
      id: c.id,
      dateInscription: c.dateInscription,
      dateReviewed: c.dateReviewed,
      authorId: c.author.id,
      author: c.author.nickname,
      reviewerId: c.reviewer?.id,
      reviewer: c.reviewer?.nickname,
      name: names[0].name,
      language: names[0].language,
      depth: c.depth,
      length: c.caveLength,
      temperature: c.temperature,
      isDiving: c.isDiving,
      nbEntrances: (c.entrances ?? []).filter((e) => !e.isDeleted).length,
    };
    await SearchService.updateDocument('caves', cave);
  },

  async permanentlyDeleteCave(cave, shouldMergeInto, mergeIntoId) {
    const ids = (arr) => (arr || []).map((e) => e.id);
    const action = shouldMergeInto ? 'merge' : 'delete';
    const target = shouldMergeInto ? mergeIntoId : null;
    const audit = {
      action,
      caveId: cave.id,
      ...(shouldMergeInto && { mergeIntoId }),
      entrances: ids(cave.entrances),
      descriptions: ids(cave.descriptions),
      documents: ids(cave.documents),
      names: ids(cave.names),
    };
    sails.log.info(
      `Permanent ${action} cave ${cave.id}: ${JSON.stringify(audit)}`
    );

    await TCave.update({ redirectTo: cave.id }).set({
      redirectTo: target,
    });
    await TNotification.destroy({ cave: cave.id });

    if (cave.documents.length > 0) {
      if (shouldMergeInto) {
        const newDocuments = cave.documents.map((e) => e.id);
        await TCave.addToCollection(mergeIntoId, 'documents', newDocuments);
      }
      await TCave.updateOne(cave.id).set({ documents: [] });
    }

    if (cave.entrances.length > 0 && shouldMergeInto) {
      const newEntrances = cave.entrances.map((e) => e.id);
      await TCave.addToCollection(mergeIntoId, 'entrances', newEntrances);
    }

    if (cave.descriptions.length > 0) {
      if (shouldMergeInto) {
        await TDescription.update({ cave: cave.id }).set({ cave: mergeIntoId });
      } else {
        await TDescription.destroy({ cave: cave.id }); // Soft delete (is_deleted = true)
        await TDescription.destroy({ cave: cave.id }); // Hard delete (removes row)
      }
    }

    await NameService.permanentDelete({ cave: cave.id });

    // Clean up junction tables before hard delete.
    // Using raw SQL because the cave is already soft-deleted at this point,
    // so Waterline's updateOne() won't find it.
    await Promise.all([
      CommonService.query(
        'DELETE FROM j_grotto_cave_explorer WHERE id_cave = $1',
        [cave.id]
      ),
      CommonService.query(
        'DELETE FROM j_caver_cave_explorer WHERE id_cave = $1',
        [cave.id]
      ),
      CommonService.query(
        'DELETE FROM j_grotto_cave_partner WHERE id_cave = $1',
        [cave.id]
      ),
    ]);

    // h_ rows are intentionally preserved for auditability.
    await TCave.destroyOne({ id: cave.id }); // Hard delete
  },
};
