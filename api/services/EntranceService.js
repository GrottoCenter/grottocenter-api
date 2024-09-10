// query to get all entrances of interest
const INTEREST_ENTRANCES_QUERY =
  'SELECT id FROM t_entrance WHERE is_of_interest=true';

// query to get a random entrance of interest
const RANDOM_ENTRANCE_QUERY = `${INTEREST_ENTRANCES_QUERY} ORDER BY RANDOM() LIMIT 1`;

const CommonService = require('./CommonService');
const ElasticsearchService = require('./ElasticsearchService');
const NotificationService = require('./NotificationService');
const GeocodingService = require('./GeocodingService');
const RecentChangeService = require('./RecentChangeService');
const CaveService = require('./CaveService');
const CommentService = require('./CommentService');
const DocumentService = require('./DocumentService');
const NameService = require('./NameService');
const RiggingService = require('./RiggingService');
const DescriptionService = require('./DescriptionService');
const HistoryService = require('./HistoryService');
const LocationService = require('./LocationService');
const RightService = require('./RightService');

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
    let isSensitive = req.param('isSensitive');
    if (isSensitive !== undefined) {
      isSensitive =
        typeof isSensitive === 'string' ? isSensitive === 'true' : isSensitive; // handle string and bool value ('true', 'false', true or false)
    }
    return {
      ...reqBodyWithoutId,
      geology: req.body.geology ?? 'Q35758',
      isSensitive,
    };
  },

  findRandom: async () => {
    const result = await CommonService.query(RANDOM_ENTRANCE_QUERY, []);
    const entranceId = result.rows[0].id;

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
      ? RightService.hasGroup(token.groups, RightService.G.ADMINISTRATOR)
      : true; // No need to call hasRight if it's not a sensitive entrance
    /* eslint-disable no-param-reassign */
    return Promise.all(
      HEntrances.map(async (entrance) => {
        if (!hasRight) {
          entrance.locations = [];
          entrance.longitude = null;
          entrance.latitude = null;
        }
        // TODO refactor this which always return the current name instead of name's revisions
        const nameResult = await NameService.setNames(
          [{ id: entrance.t_id }],
          'entrance'
        );
        entrance.names = [];
        entrance.name = '';
        if (
          nameResult &&
          nameResult[0] &&
          nameResult[0].names &&
          nameResult[0].names[0]
        ) {
          entrance.names = nameResult[0].names;
          entrance.name = entrance.names[0].name;
        }
        const caveName = await NameService.setNames(
          [{ id: entrance.cave.id ?? entrance.cave }],
          'cave'
        );
        if (caveName && caveName.length > 0) {
          entrance.caveName = caveName[0].name;
        }

        return entrance;
      })
    );
    /* eslint-enable no-param-reassign */
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

    await module.exports.createESEntrance(newEntrancePopulated).catch(() => {});

    await NotificationService.notifySubscribers(
      req,
      newEntrancePopulated,
      req.token.id,
      NotificationService.NOTIFICATION_TYPES.CREATE,
      NotificationService.NOTIFICATION_ENTITIES.ENTRANCE
    );

    return newEntrancePopulated;
  },

  async createESEntrance(populatedEntrance) {
    // Prepare data for Elasticsearch indexation
    const description =
      populatedEntrance.descriptions.length === 0
        ? null
        : // There is only one description at the moment
          `${populatedEntrance.descriptions[0].title} ${populatedEntrance.descriptions[0].body}`;

    const { cave, name, names, ...newEntranceESData } = populatedEntrance;
    await ElasticsearchService.create('entrances', populatedEntrance.id, {
      ...newEntranceESData,
      'cave name': populatedEntrance.cave.name,
      'cave length': populatedEntrance.cave.length,
      'cave depth': populatedEntrance.cave.depth,
      'cave is diving': populatedEntrance.cave.isDiving,
      country: populatedEntrance.country?.nativeName,
      'country code': populatedEntrance.country?.iso3,
      descriptions: description,
      'massifs names': populatedEntrance.cave.massifs?.names,
      name: populatedEntrance.name,
      deleted: populatedEntrance.isDeleted,
      names: populatedEntrance.names.map((n) => n.name).join(', '),
      tags: ['entrance'],
    });
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

    // Join many to many
    populatedEntrance.names = names
      ? await Promise.all(
          names.map(async (name) => {
            const res = await TName.findOne(name);
            return res;
          })
        )
      : [];

    populatedEntrance.descriptions = descriptions
      ? await Promise.all(
          descriptions.map(async (desc) => {
            const res = await TDescription.findOne(desc);
            return res;
          })
        )
      : [];

    populatedEntrance.locations = locations
      ? await Promise.all(
          locations.map(async (loc) => {
            const res = await TLocation.findOne(loc);
            return res;
          })
        )
      : [];

    populatedEntrance.documents = documents
      ? await Promise.all(
          documents.map(async (doc) => {
            const res = await TDocument.findOne(doc);
            return res;
          })
        )
      : [];

    populatedEntrance.riggings = riggings
      ? await Promise.all(
          riggings.map(async (rig) => {
            const res = await TRigging.findOne(rig);
            return res;
          })
        )
      : [];

    populatedEntrance.comments = comments
      ? await Promise.all(
          comments.map(async (comment) => {
            const res = await TComment.findOne(comment);
            return res;
          })
        )
      : [];

    return populatedEntrance;
  },

  async getPopulatedEntrance(entranceId, subEntitiesWhere = {}) {
    const entrance = await TEntrance.findOne(entranceId)
      .populate('author')
      .populate('reviewer')
      .populate('cave')
      .populate('documents')
      .populate('names');

    if (!entrance) return null;

    if (entrance.cave) {
      [entrance.cave.massifs, entrance.cave.entrances] = await Promise.all([
        CaveService.getMassifs(entrance.cave.id),
        TEntrance.find({ cave: entrance.cave.id }),
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
    entrance.stats = CommentService.getStatsFromComments(entrance.comments);

    return entrance;
  },
};
