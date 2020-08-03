/**
 */

// valid image formats
const FOUR_LETTERS_VALID_IMG_FORMATS = "'.jpg','.png','.gif','.svg'";
const FIVE_LETTERS_VALID_IMG_FORMATS = "'.jpeg'";

// query to get all entrances of interest
const INTEREST_ENTRANCES_QUERY =
  'SELECT id FROM t_entrance WHERE Is_of_interest=true';

// query to get a random entrance of interest
const RANDOM_ENTRANCE_QUERY = `${INTEREST_ENTRANCES_QUERY} ORDER BY RANDOM() LIMIT 1`;

// query to get entrance info
// TODO: filename only => we need the complete path of the file (where it is ?)
const ENTRANCE_INFO_QUERY = `
  SELECT 
    C.depth AS depth, 
    C.length AS length,
    CASE WHEN 
      LOWER(RIGHT(f.filename,4)) IN (${FOUR_LETTERS_VALID_IMG_FORMATS})
      OR
      LOWER(RIGHT(f.filename,5)) IN (${FIVE_LETTERS_VALID_IMG_FORMATS})
      THEN f.filename 
      ELSE null
    END
    AS filename
  FROM t_entrance e
  LEFT JOIN t_cave c ON e.id_cave=c.id
  LEFT JOIN t_document d ON d.id_entrance = e.id
  LEFT JOIN t_file f ON f.id_document = d.id
  WHERE E.id=$1 AND (is_public=true OR is_public IS NULL)`;

// query to count public entrances
const PUBLIC_ENTRANCES_COUNT_QUERY =
  'SELECT COUNT(id) AS count FROM t_entrance WHERE Is_public=true';

module.exports = {
  /**
   * @returns {Promise} which resolves to the succesfully findRandom
   */
  findRandom: async () => {
    const result = await CommonService.query(RANDOM_ENTRANCE_QUERY, []);
    const entranceId = result.rows[0].id;
    return EntranceService.completeRandomEntrance(entranceId);
  },

  findEntrance: async (entranceId) =>
    TEntrance.find({ id: entranceId }).limit(1),

  /**
   * @returns {Promise} which resolves to the succesfully completeRandomEntrance
   */
  completeRandomEntrance: async (entranceId) => {
    const entranceData = await EntranceService.findEntrance(entranceId);

    // add entrance to result
    const completeEntrance = { ...entranceData[0] };

    // enrich result with entrance info
    const entranceInfo = await EntranceService.getEntranceInfos(entranceId);
    if (entranceInfo) {
      completeEntrance.entranceInfo = entranceInfo;
    }

    const statistics = await CommentService.getStats(entranceId);
    if (statistics) {
      completeEntrance.stat = statistics;
    }

    const timeInfos = await CommentService.getTimeInfos(entranceId);
    if (timeInfos) {
      completeEntrance.timeInfo = timeInfos;
    }

    return completeEntrance;
  },

  getEntranceInfos: async (entranceId) => {
    const result = await CommonService.query(ENTRANCE_INFO_QUERY, [entranceId]);
    return result.rows[0];
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

  /**
   * @returns {Promise} which resolves to the succesfully query of the number of public entrances
   */
  getPublicEntrancesNumber: async () => {
    const result = await CommonService.query(PUBLIC_ENTRANCES_COUNT_QUERY, []);
    return result.rows[0];
  },
};
