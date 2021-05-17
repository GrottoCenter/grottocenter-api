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
};
