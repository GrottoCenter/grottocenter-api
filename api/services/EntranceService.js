const ramda = require('ramda');

// query to get all entrances of interest
const INTEREST_ENTRANCES_QUERY =
  'SELECT id FROM t_entrance WHERE Is_of_interest=true';

// query to get a random entrance of interest
const RANDOM_ENTRANCE_QUERY = `${INTEREST_ENTRANCES_QUERY} ORDER BY RANDOM() LIMIT 1`;

const CaveService = require('./CaveService');
const CommentService = require('./CommentService');
const CommonService = require('./CommonService');
const DocumentService = require('./DocumentService');
const ElasticsearchService = require('./ElasticsearchService');
const NameService = require('./NameService');
const NotificationService = require('./NotificationService');
const {
  NOTIFICATION_ENTITIES,
  NOTIFICATION_TYPES,
} = require('./NotificationService');
const RightService = require('./RightService');

module.exports = {
  getConvertedNameDescLocFromClientRequest: (req) => {
    let result = {
      name: {
        author: req.token.id,
        text: req.param('name').text,
        language: req.param('name').language,
      },
    };
    if (ramda.pathOr(null, ['description', 'body'], req.body)) {
      result = {
        ...result,
        description: {
          author: req.token.id,
          body: req.body.description.body,
          language: req.body.description.language,
          title: req.body.description.title,
        },
      };
    }

    if (ramda.pathOr(null, ['location', 'body'], req.body)) {
      result = {
        ...result,
        location: {
          author: req.token.id,
          body: req.body.location.body,
          language: req.body.location.language,
        },
      };
    }

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
      geology: ramda.propOr('Q35758', 'geology', req.body),
      isSensitive,
    };
  },

  /**
   * @returns {Promise} which resolves to the succesfully findRandom
   */
  findRandom: async () => {
    const result = await CommonService.query(RANDOM_ENTRANCE_QUERY, []);
    const entranceId = result.rows[0].id;
    return module.exports.completeRandomEntrance(entranceId);
  },

  findEntrance: async (entranceId) => {
    const entrance = await TEntrance.findOne(entranceId)
      .populate('cave')
      .populate('documents')
      .populate('names');

    if (entrance.cave)
      entrance.cave.entrances = await TEntrance.find().where({
        cave: entrance.cave.id,
      });

    if (!ramda.isNil(entrance.documents)) {
      entrance.documents = await Promise.all(
        entrance.documents.map(async (doc) => ({
          ...doc,
          files: await DocumentService.getTopoFiles(doc.id),
        }))
      );
    }
    return entrance;
  },

  /**
   * @returns {Promise} which resolves to the succesfully completeRandomEntrance
   */
  completeRandomEntrance: async (entranceId) => {
    const entranceData = await module.exports.findEntrance(entranceId);
    entranceData.stats = await CommentService.getStatsFromId(entranceId);
    entranceData.timeInfo = await CommentService.getTimeInfos(entranceId);
    return entranceData;
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
      ? await sails.helpers.checkRight.with({
          groups: token.groups,
          rightEntity: RightService.RightEntities.ENTRANCE,
          rightAction: RightService.RightActions.VIEW_COMPLETE,
        })
      : true; // No need to call checkRight if it's not a sensitive entrance
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
    const newEntrancePopulated = await sails
      .getDatastore()
      .transaction(async (db) => {
        const newEntrance = await TEntrance.create(entranceData)
          .fetch()
          .usingConnection(db);

        // Name
        if (ramda.pathOr(null, ['name', 'text'], nameDescLocData)) {
          await TName.create({
            author: nameDescLocData.name.author,
            dateInscription: ramda.propOr(
              new Date(),
              'dateInscription',
              nameDescLocData.name
            ),
            dateReviewed: ramda.propOr(
              undefined,
              'dateReviewed',
              nameDescLocData.name
            ),
            entrance: newEntrance.id,
            isMain: true,
            language: nameDescLocData.name.language,
            name: nameDescLocData.name.text,
          })
            .fetch()
            .usingConnection(db);
        }
        // Description (if provided)
        if (ramda.pathOr(null, ['description', 'body'], nameDescLocData)) {
          await TDescription.create({
            author: nameDescLocData.description.author,
            body: nameDescLocData.description.body,
            dateInscription: ramda.propOr(
              new Date(),
              'dateInscription',
              nameDescLocData.description
            ),
            dateReviewed: ramda.propOr(
              undefined,
              'dateReviewed',
              nameDescLocData.description
            ),
            entrance: newEntrance.id,
            language: nameDescLocData.description.language,
            title: nameDescLocData.description.title,
          }).usingConnection(db);
        }

        // Location (if provided)
        if (ramda.pathOr(null, ['location', 'body'], nameDescLocData)) {
          await TLocation.create({
            author: nameDescLocData.location.author,
            body: nameDescLocData.location.body,
            dateInscription: ramda.propOr(
              new Date(),
              'dateInscription',
              nameDescLocData.location
            ),
            dateReviewed: ramda.propOr(
              undefined,
              'dateReviewed',
              nameDescLocData.location
            ),
            entrance: newEntrance.id,
            language: nameDescLocData.location.language,
          }).usingConnection(db);
        }

        // Prepare data for Elasticsearch indexation
        const res = await TEntrance.findOne(newEntrance.id)
          .populate('cave')
          .populate('country')
          .populate('descriptions')
          .usingConnection(db);
        return res;
      });

    // Prepare data for Elasticsearch indexation
    const description =
      newEntrancePopulated.descriptions.length === 0
        ? null
        : // There is only one description at the moment
          `${newEntrancePopulated.descriptions[0].title} ${newEntrancePopulated.descriptions[0].body}`;

    // Format cave massif
    newEntrancePopulated.cave.massif = {
      id: newEntrancePopulated.cave.massif,
    };
    await CaveService.setEntrances([newEntrancePopulated.cave]);
    await NameService.setNames([newEntrancePopulated], 'entrance');
    await NameService.setNames([newEntrancePopulated.cave], 'cave');
    await NameService.setNames([newEntrancePopulated.cave.massif], 'massif');

    const { cave, name, names, ...newEntranceESData } = newEntrancePopulated;
    await ElasticsearchService.create('entrances', newEntrancePopulated.id, {
      ...newEntranceESData,
      'cave name': newEntrancePopulated.cave.name,
      'cave length': newEntrancePopulated.cave.length,
      'cave depth': newEntrancePopulated.cave.depth,
      'cave is diving': newEntrancePopulated.cave.isDiving,
      country: newEntrancePopulated.country?.nativeName,
      'country code': newEntrancePopulated.country?.iso3,
      descriptions: description,
      'massifs names': newEntrancePopulated.cave.massifs?.names,
      name: newEntrancePopulated.name,
      deleted: newEntrancePopulated.isDeleted,
      names: newEntrancePopulated.names.map((n) => n.name).join(', '),
      tags: ['entrance'],
    });

    await NotificationService.notifySubscribers(
      req,
      newEntrancePopulated,
      req.token.id,
      NOTIFICATION_TYPES.CREATE,
      NOTIFICATION_ENTITIES.ENTRANCE
    );

    return newEntrancePopulated;
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
};
