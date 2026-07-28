// query to get all entrances of interest
const INTEREST_ENTRANCES_QUERY =
  'SELECT id FROM t_entrance WHERE is_of_interest=true';

// query to get a random entrance of interest
const RANDOM_ENTRANCE_QUERY = `${INTEREST_ENTRANCES_QUERY} ORDER BY RANDOM() LIMIT 1`;

const CommonService = require('./CommonService');
const SearchService = require('./SearchService');
const NotificationService = require('./NotificationService');
const CountryResolverService = require('./CountryResolverService');
const EnrichmentQueueService = require('./EnrichmentQueueService');
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
const TemporalNameResolver = require('./TemporalNameResolver');
const RiggingService = require('./RiggingService');
const DescriptionService = require('./DescriptionService');
const HistoryService = require('./HistoryService');
const LocationService = require('./LocationService');
const RightService = require('./RightService');
const coerceToInt = require('../utils/coerceToInt');
const coerceBool = require('../utils/coerceBool');
const { getQualityData } = require('../utils/computeEntranceDataQuality');
const { computeCommentsRating } = require('../utils/commentsRating');

/**
 * Map a raw h_name SQL row to a camelCase object.
 * @param {object} row - Raw row from the h_name query.
 * @param {object} [options]
 * @param {boolean} [options.includeAuthorReviewer=false] - Whether to include
 *   author/reviewer nested objects (requires joined columns).
 * @returns {object} Mapped h_name record.
 */
const mapHNameRow = (row, { includeAuthorReviewer = false } = {}) => {
  const mapped = {
    id: row.id,
    name: row.name,
    isMain: row.is_main,
    language: row.id_language ?? null,
    dateInscription: row.date_inscription,
    dateReviewed: row.date_reviewed,
    entrance: row.id_entrance,
    cave: row.id_cave,
  };
  if (includeAuthorReviewer) {
    mapped.author = row.id_author
      ? { id: row.id_author, nickname: row.author_nickname }
      : null;
    mapped.reviewer = row.id_reviewer
      ? { id: row.id_reviewer, nickname: row.reviewer_nickname }
      : null;
  }
  return mapped;
};

module.exports = {
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
      isSensitiveLocked: coerceBool(req, 'isSensitiveLocked'),
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
    const tEntranceRecords = await TEntrance.find({
      where: { id: entranceId },
      select: ['isSensitive', 'cave'],
    });
    // Check if the entrance exist
    if (Object.keys(tEntranceRecords).length === 0) {
      return {};
    }
    const isEntranceSensitive = tEntranceRecords[0]
      ? tEntranceRecords[0].isSensitive
      : true;
    const currentCaveId = tEntranceRecords[0]?.cave ?? null;
    const hasRight = isEntranceSensitive
      ? RightService.hasGroup(token?.groups, RightService.G.ADMINISTRATOR)
      : true; // No need to call hasRight if it's not a sensitive entrance

    // Fetch all HName records for the entrance (temporal resolution)
    // Use raw SQL because h_name has a composite PK (id, date_reviewed) but
    // the Waterline model declares primaryKey: 'id'. When the same t_name row
    // is updated multiple times, h_name contains multiple rows with the same id
    // but different date_reviewed. Waterline deduplicates by id, losing records.
    const numericEntranceId =
      typeof entranceId === 'string' ? parseInt(entranceId, 10) : entranceId;
    if (Number.isNaN(numericEntranceId)) return [];
    const entranceHNamesRaw = await CommonService.query(
      `SELECT h.id, h.name, h.is_main, h.date_inscription, h.date_reviewed,
              h.id_entrance, h.id_cave, h.id_language, h.id_author, h.id_reviewer,
              a.nickname AS author_nickname, r.nickname AS reviewer_nickname
       FROM h_name h
       LEFT JOIN t_caver a ON a.id = h.id_author
       LEFT JOIN t_caver r ON r.id = h.id_reviewer
       WHERE h.id_entrance = $1 AND h.is_main = true
       ORDER BY h.date_reviewed`,
      [numericEntranceId]
    );
    const entranceHNames = (entranceHNamesRaw.rows || []).map((row) =>
      mapHNameRow(row, { includeAuthorReviewer: true })
    );

    // Fetch the current main name as fallback for temporal resolution
    const mainEntranceName = await TName.findOne({
      entrance: entranceId,
      isMain: true,
    });
    const currentEntranceName = mainEntranceName ? mainEntranceName.name : null;

    // Collect unique cave IDs from HEntrance records + current association
    const caveIds = [
      ...new Set(
        [
          currentCaveId,
          ...HEntrances.filter((e) => e.cave).map((e) => e.cave?.id ?? e.cave),
        ].filter(Boolean)
      ),
    ];

    // Batch-fetch cave h_name records and current cave names
    const caveHNameMap = new Map();
    const currentCaveNameMap = new Map();
    if (caveIds.length > 0) {
      // Use raw SQL for the same composite PK deduplication reason as above.
      // Author/reviewer not needed here — cave h_name records are only used
      // for resolveNameAtDate which only reads `name` and `dateReviewed`.
      const placeholders = caveIds.map((_, i) => `$${i + 1}`).join(', ');
      const caveHNamesRaw = await CommonService.query(
        `SELECT id, name, is_main, date_inscription, date_reviewed, id_cave
         FROM h_name
         WHERE id_cave IN (${placeholders}) AND is_main = true
         ORDER BY date_reviewed`,
        caveIds
      );
      for (const row of caveHNamesRaw.rows || []) {
        const caveId = row.id_cave;
        if (!caveHNameMap.has(caveId)) caveHNameMap.set(caveId, []);
        caveHNameMap.get(caveId).push(mapHNameRow(row));
      }
      const currentCaveNames = await TName.find({
        cave: caveIds,
        isMain: true,
      });
      for (const record of currentCaveNames) {
        const caveId = record.cave?.id ?? record.cave;
        if (!currentCaveNameMap.has(caveId))
          currentCaveNameMap.set(caveId, record.name);
      }
    }

    /* eslint-disable no-param-reassign */
    // NOTE on mixed semantic (intentional):
    // `name`, `caveName`, and `language` are resolved temporally (state at that point in time)
    // using h_name records, while `latitude`, `longitude`, booleans, etc. come from the
    // h_entrance OLD row ("state before the change"). This is a deliberate trade-off:
    // temporal resolution is applied only to fields where the raw OLD values are unavailable
    // (names/language are stored in a separate table) or where displaying the historical
    // "active" value is significantly more useful to the UI than displaying raw OLD data.
    HEntrances.forEach((entrance) => {
      if (!hasRight) {
        entrance.locations = [];
        entrance.longitude = null;
        entrance.latitude = null;
      }
      // entrance.id is the snapshot's date_reviewed timestamp (Waterline PK)
      entrance.name = TemporalNameResolver.resolveNameAtDate(
        entrance.id,
        entranceHNames,
        currentEntranceName
      );
      // Resolve the language from the h_name record that was active at this
      // snapshot's date_reviewed, falling back to the current main name language.
      entrance.language = TemporalNameResolver.resolveLanguageAtDate(
        entrance.id,
        entranceHNames,
        mainEntranceName?.language ?? null
      );
      // Do not assign current TName records — snapshots should not expose
      // the current state. The names array is left empty for consistency with
      // the "state before the change" semantic used by all other h_ snapshots.
      entrance.names = [];
    });
    /* eslint-enable no-param-reassign */

    TemporalNameResolver.resolveCaveNamesForSnapshots(
      HEntrances,
      caveHNameMap,
      currentCaveNameMap
    );

    const resolveCaveNameFn = (snapshotDate) => {
      // Uses current cave association; historical cave-at-rename-time isn't tracked
      if (!currentCaveId) return null;
      return TemporalNameResolver.resolveNameAtDate(
        snapshotDate,
        caveHNameMap.get(currentCaveId) || [],
        currentCaveNameMap.get(currentCaveId) || null
      );
    };

    const nameChangeSnapshots = TemporalNameResolver.buildNameChangeSnapshots(
      entranceId,
      TemporalNameResolver.filterToActualNameChanges(
        entranceHNames,
        currentEntranceName
      ),
      resolveCaveNameFn
    );

    return TemporalNameResolver.mergeAndSort(HEntrances, nameChangeSnapshots);
  },

  createEntrance: async (req, entranceData, nameDescLocData) => {
    // Synchronous country resolution (offline, no network dependency)
    // eslint-disable-next-line no-param-reassign
    entranceData.country = CountryResolverService.resolve(
      entranceData.latitude,
      entranceData.longitude
    );

    /* eslint-disable no-param-reassign */
    entranceData.geology = entranceData.geology ?? 'Q35758';
    entranceData.isSensitive = entranceData.isSensitive ?? false;
    entranceData.isSensitiveLocked = entranceData.isSensitiveLocked ?? false;
    entranceData.dateInscription = entranceData.dateInscription ?? new Date();
    /* eslint-enable no-param-reassign */

    let autoMarkedSensitive = false;
    // Automatically inherit sensitivity from the massif, unless the entrance's
    // sensitivity is locked (an admin explicitly froze it, so it's exempt from
    // the massif's sensitivity — mirrors the mark-sensitive cascade skip).
    if (
      !entranceData.isSensitiveLocked &&
      entranceData.latitude !== null &&
      entranceData.longitude !== null
    ) {
      /* eslint-disable no-param-reassign */
      const isPointInSensitiveMassif =
        await MassifService.isPointInSensitiveMassif(
          entranceData.latitude,
          entranceData.longitude
        );
      if (!entranceData.isSensitive && isPointInSensitiveMassif) {
        autoMarkedSensitive = true;
      }
      entranceData.isSensitive =
        entranceData.isSensitive || isPointInSensitiveMassif;
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

    if (autoMarkedSensitive) {
      sails.log.info(
        `Entrance with ID ${newEntranceId} auto-marked sensitive at creation because its coordinates lie within a sensitive massif.`
      );
    }

    await RecentChangeService.setNameCreate(
      'entrance',
      newEntranceId,
      req.token.id,
      nameDescLocData.name.text
    );

    // Enqueue async enrichment (region, county, city, iso_3166_2)
    if (entranceData.country !== '00') {
      EnrichmentQueueService.enqueue(
        newEntranceId,
        'entrance',
        req.traceId
      ).catch((err) => {
        sails.log.error('Failed to enqueue entrance enrichment:', err);
      });
    }

    const newEntrancePopulated =
      await module.exports.getPopulatedEntrance(newEntranceId);

    await module.exports.updateInSearch(newEntrancePopulated);

    await NotificationService.notifySubscribers(
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
      commentsRating: computeCommentsRating(comments ?? []),
    };

    if (entrance.isSensitive) {
      entrance.latitude = null;
      entrance.longitude = null;
    }

    // Compute data quality score and fetch massifs in parallel (independent queries)
    const [qualityRows, massifRows] = await Promise.all([
      CommonService.query(
        `SELECT general_latest_date_of_update, general_nb_contributions,
                location_latest_date_of_update, location_nb_contributions,
                description_latest_date_of_update, description_nb_contributions,
                document_latest_date_of_update, document_nb_contributions,
                rigging_latest_date_of_update, rigging_nb_contributions,
                history_latest_date_of_update, history_nb_contributions,
                comment_latest_date_of_update, comment_nb_contributions
         FROM v_data_quality_compute_entrance WHERE id_entrance = $1 ORDER BY id_massif ASC LIMIT 1`,
        [rawEntrance.id]
      ),
      CommonService.query(
        `SELECT m.id, n.name, n.id_language AS language
         FROM t_massif m
         JOIN t_entrance e ON ST_Contains(m.geog_polygon::geometry, e.point_geom)
         LEFT JOIN t_name n ON n.id_massif = m.id AND n.is_main = true AND n.is_deleted = false
         WHERE e.id = $1 AND e.is_deleted = false AND m.is_deleted = false`,
        [rawEntrance.id]
      ),
    ]);
    entrance.dataQuality = qualityRows?.rows?.[0]
      ? getQualityData(qualityRows.rows[0])
      : 0;
    entrance.massifs =
      massifRows?.rows?.map((r) => ({
        id: r.id,
        name: r.name,
        language: r.language,
        isDeleted: false,
      })) ?? [];

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
      DocumentService.getDocumentsForCitation(
        entrance.documents.map((d) => d.id)
      ),
    ]);

    return entrance;
  },
};
