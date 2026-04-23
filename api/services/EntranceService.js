// query to get all entrances of interest
const INTEREST_ENTRANCES_QUERY =
  'SELECT id FROM t_entrance WHERE is_of_interest=true';

// query to get a random entrance of interest
const RANDOM_ENTRANCE_QUERY = `${INTEREST_ENTRANCES_QUERY} ORDER BY RANDOM() LIMIT 1`;

const CommonService = require('./CommonService');
const SearchService = require('./SearchService');
const NotificationService = require('./NotificationService');
const GeocodingService = require('./GeocodingService');
const RecentChangeService = require('./RecentChangeService');
const CaveService = require('./CaveService');
const CommentService = require('./CommentService');
const DocumentService = require('./DocumentService');
const MassifService = require('./MassifService');
const {
  NON_INDEXED_BOOLEAN_FIELDS,
  computeDateLastModif,
} = require('../../config/constants/entrance');
const NameService = require('./NameService');
const RiggingService = require('./RiggingService');
const DescriptionService = require('./DescriptionService');
const HistoryService = require('./HistoryService');
const LocationService = require('./LocationService');
const RightService = require('./RightService');
const coerceToInt = require('../utils/coerceToInt');

function coerceBool(req, field) {
  const value = req.param(field);
  if (value === undefined || value === null) return value;
  return typeof value === 'string' ? value === 'true' : Boolean(value);
}

module.exports = {
  coerceBool,

  getConvertedNameFromClientRequest: (req) => {
    const result = {
      name: {
        author: req.token.id,
        text: req.param('name').text,
        language: req.param('name').language,
      },
    };
    return result;
  },

  // Extract everything from the request body except id
  getConvertedDataFromClientRequest: (req) => {
    // remove id if present to avoid null id (and an error)
    const { id, ...reqBodyWithoutId } = req.body;
    return {
      ...reqBodyWithoutId,
      altitude: coerceToInt(reqBodyWithoutId.altitude),
      precision: coerceToInt(reqBodyWithoutId.precision),
      yearDiscovery: coerceToInt(reqBodyWithoutId.yearDiscovery),
      geology: req.body.geology ?? 'Q35758',
      isSensitive: coerceBool(req, 'isSensitive'),
      hasBat: coerceBool(req, 'hasBat'),
      dangerFlooding: coerceBool(req, 'dangerFlooding'),
      dangerCo2: coerceBool(req, 'dangerCo2'),
      dangerRockfall: coerceBool(req, 'dangerRockfall'),
      dangerPollution: coerceBool(req, 'dangerPollution'),
      needCleanGear: coerceBool(req, 'needCleanGear'),
      needStayOnTrail: coerceBool(req, 'needStayOnTrail'),
      hasRules: coerceBool(req, 'hasRules'),
      isTouristic: coerceBool(req, 'isTouristic'),
    };
  },

  findRandom: async () => {
    const result = await CommonService.query(RANDOM_ENTRANCE_QUERY, []);
    const entranceId = result.rows[0]?.id;
    if (!entranceId) return null;

    const [entrance, stats, timeInfo] = await Promise.all([
      TEntrance.findOne(entranceId).populate('names'),
      CommentService.getStatsFromId(entranceId),
      CommentService.getTimeInfos(entranceId),
    ]);

    entrance.stats = stats;
    entrance.timeInfo = timeInfo;
    return entrance;
  },

  // If the entrance do not belong to a network the associated cave is populated
  getHEntrancesById: async (entranceId, isNetwork, token) => {
    let entrancesH;
    if (isNetwork === 'true') {
      entrancesH = await HEntrance.find({ t_id: entranceId })
        .populate('reviewer')
        .populate('author');
      return module.exports.getHEntrancesWithName(
        entranceId,
        entrancesH,
        token
      );
    }
    entrancesH = await HEntrance.find({ t_id: entranceId })
      .populate('reviewer')
      .populate('author')
      .populate('cave');
    return module.exports.getHEntrancesWithName(entranceId, entrancesH, token);
  },

  getHEntrancesWithName: async (entranceId, HEntrances, token) => {
    const tEntranceSensitivity = await TEntrance.find({
      where: { id: entranceId },
      select: ['isSensitive'],
    });
    // Check if the entrance exist
    if (Object.keys(tEntranceSensitivity).length === 0) {
      return {};
    }
    const isEntranceSensitive = tEntranceSensitivity[0]
      ? tEntranceSensitivity[0].isSensitive
      : true;
    const hasRight = isEntranceSensitive
      ? RightService.hasGroup(token?.groups, RightService.G.ADMINISTRATOR)
      : true; // No need to call hasRight if it's not a sensitive entrance

    // Batch resolve entrance names — one call for all history entries
    const entranceStubs = HEntrances.map((e) => ({ id: e.t_id }));
    await NameService.setNames(entranceStubs, 'entrance');
    const entranceNameMap = new Map(
      entranceStubs.map((s) => [s.id, { names: s.names, name: s.name }])
    );

    // Batch resolve cave names for entries that have a cave
    const caveIds = [
      ...new Set(
        HEntrances.filter((e) => e.cave).map((e) => e.cave?.id ?? e.cave)
      ),
    ];
    const caveNameMap = new Map();
    if (caveIds.length > 0) {
      const caveStubs = caveIds.map((id) => ({ id }));
      await NameService.setNames(caveStubs, 'cave');
      caveStubs.forEach((s) => caveNameMap.set(s.id, s.name));
    }

    /* eslint-disable no-param-reassign */
    HEntrances.forEach((entrance) => {
      if (!hasRight) {
        entrance.locations = [];
        entrance.longitude = null;
        entrance.latitude = null;
      }
      const resolved = entranceNameMap.get(entrance.t_id);
      entrance.names = resolved?.names ?? [];
      entrance.name = resolved?.name ?? '';

      if (entrance.cave) {
        const caveId = entrance.cave?.id ?? entrance.cave;
        entrance.caveName = caveNameMap.get(caveId) ?? null;
      }
    });
    /* eslint-enable no-param-reassign */

    return HEntrances;
  },

  createEntrance: async (req, entranceData, nameDescLocData) => {
    const address = await GeocodingService.reverse(
      entranceData.latitude,
      entranceData.longitude
    );
    if (address) {
      /* eslint-disable no-param-reassign */
      entranceData.region = address.region;
      entranceData.county = address.county;
      entranceData.city = address.city;
      entranceData.country = address.id_country;
      entranceData.iso_3166_2 = address.iso_3166_2;
      /* eslint-enable no-param-reassign */
    }

    /* eslint-disable no-param-reassign */
    entranceData.geology = entranceData.geology ?? 'Q35758';
    entranceData.isSensitive = entranceData.isSensitive ?? false;
    entranceData.dateInscription = entranceData.dateInscription ?? new Date();
    /* eslint-enable no-param-reassign */

    // Automatically inherit sensitivity from the massif
    if (entranceData.latitude !== null && entranceData.longitude !== null) {
      /* eslint-disable no-param-reassign */
      entranceData.isSensitive =
        entranceData.isSensitive ||
        (await MassifService.isPointInSensitiveMassif(
          entranceData.latitude,
          entranceData.longitude
        ));
      /* eslint-enable no-param-reassign */
    }

    const newEntranceId = await sails.getDatastore().transaction(async (db) => {
      const newEntrance = await TEntrance.create(entranceData)
        .fetch()
        .usingConnection(db);

      // Name
      if (nameDescLocData?.name?.text) {
        await TName.create({
          author: nameDescLocData.name.author,
          dateInscription: nameDescLocData.name?.dateInscription ?? new Date(),
          dateReviewed: nameDescLocData.name?.dateReviewed ?? undefined,
          entrance: newEntrance.id,
          isMain: true,
          language: nameDescLocData.name.language,
          name: nameDescLocData.name.text,
        })
          .fetch()
          .usingConnection(db);
      }
      // Description (if provided durring csv import)
      if (nameDescLocData?.description?.body) {
        await TDescription.create({
          author: nameDescLocData.description.author,
          body: nameDescLocData.description.body,
          dateInscription:
            nameDescLocData.description?.dateInscription ?? new Date(),
          dateReviewed: nameDescLocData.description?.dateReviewed ?? undefined,
          entrance: newEntrance.id,
          language: nameDescLocData.description.language,
          title: nameDescLocData.description.title,
        }).usingConnection(db);
      }

      // Location (if provided durring csv import)
      if (nameDescLocData?.location?.body) {
        await TLocation.create({
          author: nameDescLocData.location.author,
          body: nameDescLocData.location.body,
          dateInscription:
            nameDescLocData.location?.dateInscription ?? new Date(),
          dateReviewed: nameDescLocData.location?.dateReviewed ?? undefined,
          entrance: newEntrance.id,
          language: nameDescLocData.location.language,
        }).usingConnection(db);
      }

      return newEntrance.id;
    });

    await RecentChangeService.setNameCreate(
      'entrance',
      newEntranceId,
      req.token.id,
      nameDescLocData.name.text
    );

    const newEntrancePopulated =
      await module.exports.getPopulatedEntrance(newEntranceId);

    await module.exports.updateInSearch(newEntrancePopulated);

    await NotificationService.notifySubscribers(
      req,
      newEntrancePopulated,
      req.token.id,
      NotificationService.NOTIFICATION_TYPES.CREATE,
      NotificationService.NOTIFICATION_ENTITIES.ENTRANCE
    );

    return newEntrancePopulated;
  },

  async deleteInSearch(entranceId) {
    await SearchService.deleteDocument('entrances', entranceId);
  },

  async updateInSearch(populatedEntrance) {
    // Warning: All linked entities may contain sensitive information (same as in document).
    // For example, the complete caver object for the 'author' and 'reviewer' fields.
    // Although we could leave them intact, since search results also pass through the converter,
    // We prefer to clean them to ensure only clean data remains in the search database.
    const rawEntrance = populatedEntrance.toJSON
      ? populatedEntrance.toJSON()
      : populatedEntrance;
    const {
      names,
      country,
      cave,
      locations,
      descriptions,
      riggings,
      histories,
      documents,
      comments,
      ...e
    } = rawEntrance;
    // Strip non-indexed boolean characteristics from search document
    NON_INDEXED_BOOLEAN_FIELDS.forEach((f) => delete e[f]);
    const entrance = {
      ...e,
      numericId: e.id,
      dateInscription: e.dateInscription,
      dateReviewed: e.dateReviewed,
      dateLastModif: computeDateLastModif(
        new Date(e.dateInscription).getTime(),
        e.dateReviewed ? new Date(e.dateReviewed).getTime() : null
      ),
      authorId: e.author?.id,
      author: e.author?.nickname,
      reviewerId: e.reviewer?.id,
      reviewer: e.reviewer?.nickname,
      name: names?.[0]?.name,
      language: names?.[0]?.language,
      iso3166: e.iso_3166_2,
      country: [country?.id, country?.nativeName].filter((c) => c).join(' - '),
      geology: e.geology?.trim(),
      cave: cave && {
        name: cave.name,
        depth: cave.depth,
        length: cave.caveLength,
        temperature: cave.temperature,
        isDiving: cave.isDiving,
      },
      descriptions: descriptions?.map((d) => ({
        title: d.title,
        body: d.body,
      })),
      locations: locations?.map((l) => ({ title: l.title, body: l.body })),
      riggings: riggings?.map((r) => ({
        title: r.title,
        obstacles: r.obstacles,
        ropes: r.ropes,
        anchors: r.anchors,
      })),
      histories: histories?.map((h) => ({ body: h.body })),
      documents: documents?.map((d) => d.id),
      comments: comments?.map((c) => ({
        title: c.title,
        body: c.body,
        aestheticism: c.aestheticism,
        caving: c.caving,
        approach: c.approach,
      })),
    };

    if (entrance.isSensitive) {
      entrance.latitude = null;
      entrance.longitude = null;
      entrance.locations = [];
    }

    await SearchService.updateDocument('entrances', entrance);
  },

  /**
   * Populate any entrance-like object.
   * Avoid using when possible.
   * Mainly used for json column that cannot be populated using waterline query language.
   * @param {*} entrance
   * @returns populated entrance
   */
  populateJSON: async (entrance) => {
    const {
      author,
      cave,
      names,
      descriptions,
      geology,
      locations,
      documents,
      riggings,
      comments,
      ...cleanedData
    } = entrance;

    const populatedEntrance = { ...cleanedData };

    // Join one to many
    populatedEntrance.author = author ? await TCaver.findOne(author) : null;
    populatedEntrance.cave = cave ? await TCave.findOne(cave) : null;
    populatedEntrance.geology = geology
      ? await TGeology.findOne(geology)
      : null;

    // Join many to many — batch find instead of per-item findOne
    populatedEntrance.names = names?.length
      ? await TName.find({ id: names })
      : [];

    populatedEntrance.descriptions = descriptions?.length
      ? await TDescription.find({ id: descriptions })
      : [];

    populatedEntrance.locations = locations?.length
      ? await TLocation.find({ id: locations })
      : [];

    populatedEntrance.documents = documents?.length
      ? await TDocument.find({ id: documents })
      : [];

    populatedEntrance.riggings = riggings?.length
      ? await TRigging.find({ id: riggings })
      : [];

    populatedEntrance.comments = comments?.length
      ? await TComment.find({ id: comments })
      : [];

    return populatedEntrance;
  },

  async getPopulatedEntrance(entranceId, subEntitiesWhere = {}) {
    const entrance = await TEntrance.findOne(entranceId)
      .populate('author')
      .populate('reviewer')
      .populate('cave')
      .populate('documents')
      .populate('country')
      .populate('names');

    if (!entrance) return null;

    if (entrance.cave) {
      [
        entrance.cave.massifs,
        entrance.cave.entrances,
        entrance.cave.exploringOrganizations,
      ] = await Promise.all([
        CaveService.getMassifs(entrance.cave.id),
        TEntrance.find({ cave: entrance.cave.id }),
        CaveService.getExploringOrganizations(entrance.cave.id),
      ]);
      await Promise.all([
        NameService.setNames(entrance.cave.massifs, 'massif'),
        NameService.setNames([entrance.cave], 'cave'),
      ]);
    }

    [
      entrance.descriptions,
      entrance.locations,
      entrance.riggings,
      entrance.histories,
      entrance.comments,
      entrance.documents,
    ] = await Promise.all([
      DescriptionService.getEntranceDescriptions(entrance.id, subEntitiesWhere),
      LocationService.getEntranceLocations(entrance.id, subEntitiesWhere),
      RiggingService.getEntranceRiggings(entrance.id, subEntitiesWhere),
      HistoryService.getEntranceHistories(entrance.id, subEntitiesWhere),
      CommentService.getEntranceComments(entrance.id, subEntitiesWhere),
      DocumentService.getDocuments(entrance.documents.map((d) => d.id)),
    ]);

    return entrance;
  },
};
