const ramda = require('ramda');

// valid image formats
const FOUR_LETTERS_VALID_IMG_FORMATS = "'.jpg','.png','.gif','.svg'";
const FIVE_LETTERS_VALID_IMG_FORMATS = "'.jpeg'";

// query to get all entrances of interest
const INTEREST_ENTRANCES_QUERY =
  'SELECT id FROM t_entrance WHERE Is_of_interest=true';

// query to get a random entrance of interest
const RANDOM_ENTRANCE_QUERY = `${INTEREST_ENTRANCES_QUERY} ORDER BY RANDOM() LIMIT 1`;

module.exports = {
  /**
   * @returns {Promise} which resolves to the succesfully findRandom
   */
  findRandom: async () => {
    const result = await CommonService.query(RANDOM_ENTRANCE_QUERY, []);
    const entranceId = result.rows[0].id;
    return EntranceService.completeRandomEntrance(entranceId);
  },

  findEntrance: async (entranceId) => {
    let entrance = await TEntrance.findOne(entranceId)
      .populate('cave')
      .populate('documents')
      .populate('names');
    if (!ramda.isNil(entrance.documents)) {
      entrance.documents = await Promise.all(
        entrance.documents.map(async (doc) => ({
          ...doc,
          files: await DocumentService.getTopoFiles(doc.id),
        })),
      );
    }
    return entrance;
  },

  /**
   * @returns {Promise} which resolves to the succesfully completeRandomEntrance
   */
  completeRandomEntrance: async (entranceId) => {
    const entranceData = await EntranceService.findEntrance(entranceId);
    entranceData.stats = await CommentService.getStats(entranceId);
    entranceData.timeInfo = await CommentService.getTimeInfos(entranceId);
    return entranceData;
  },

  /**
   * @returns {Promise} which resolves to the succesfully findAllInterestEntrances
   */
  findAllInterestEntrances: async () => {
    const entrances = await CommonService.query(INTEREST_ENTRANCES_QUERY, []);

    const allEntrances = [];
    const mapEntrances = entrances.rows.map(async (item) => {
      const entrance = await EntranceService.completeRandomEntrance(item.id);
      allEntrances.push(entrance);
    });

    await Promise.all(mapEntrances);
    return allEntrances;
  },

  createEntrance: async (
    entranceData,
    nameDescLocData,
    errorHandler,
    esClient,
  ) => {
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
              nameDescLocData.name,
            ),
            dateReviewed: ramda.propOr(
              undefined,
              'dateReviewed',
              nameDescLocData.name,
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
              nameDescLocData.description,
            ),
            dateReviewed: ramda.propOr(
              undefined,
              'dateReviewed',
              nameDescLocData.description,
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
              nameDescLocData.location,
            ),
            dateReviewed: ramda.propOr(
              undefined,
              'dateReviewed',
              nameDescLocData.location,
            ),
            entrance: newEntrance.id,
            language: nameDescLocData.location.language,
          }).usingConnection(db);
        }

        // Prepare data for Elasticsearch indexation
        const newEntrancePopulated = await TEntrance.findOne(newEntrance.id)
          .populate('cave')
          .populate('country')
          .populate('descriptions')
          .usingConnection(db);
        return newEntrancePopulated;
      })
      .intercept(errorHandler);

    // Prepare data for Elasticsearch indexation
    const description =
      newEntrancePopulated.descriptions.length === 0
        ? null
        : // There is only one description at the moment
          newEntrancePopulated.descriptions[0].title +
          ' ' +
          newEntrancePopulated.descriptions[0].body;

    // Format cave massif
    newEntrancePopulated.cave.massif = {
      id: newEntrancePopulated.cave.massif,
    };
    await CaveService.setEntrances([newEntrancePopulated.cave]);
    await NameService.setNames([newEntrancePopulated], 'entrance');
    await NameService.setNames([newEntrancePopulated.cave], 'cave');
    await NameService.setNames([newEntrancePopulated.cave.massif], 'massif');

    const { cave, name, names, ...newEntranceESData } = newEntrancePopulated;
    try {
      esClient.create({
        index: `entrances-index`,
        type: 'data',
        id: newEntrancePopulated.id,
        body: {
          ...newEntranceESData,
          name: newEntrancePopulated.name,
          names: newEntrancePopulated.names.map((n) => n.name).join(', '),
          descriptions: [description],
          type: 'entrance',
          'cave name': newEntrancePopulated.cave.name,
          'cave length': newEntrancePopulated.cave.length,
          'cave depth': newEntrancePopulated.cave.depth,
          'cave is diving': newEntrancePopulated.cave.isDiving,
          'massif name': newEntrancePopulated.cave.massif.name,
          country: newEntrancePopulated.country.nativeName,
          'country code': newEntrancePopulated.country.iso3,
        },
      });
    } catch (error) {
      sails.log.error(error);
    }

    return newEntrancePopulated;
  },
};
