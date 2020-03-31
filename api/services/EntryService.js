/**
 */

// valid image formats
const VALID_IMG_FORMATS = "'.jpg','.png','.gif','.svg'";
const OTHER_VALID_IMG_FORMATS = "'.jpeg'";

// query to get all entries of interest
const INTEREST_ENTRIES_QUERY = 'SELECT id FROM t_entry WHERE Is_of_interest=1';

// query to get a random entry of interest
const RANDOM_ENTRY_QUERY = `${INTEREST_ENTRIES_QUERY} ORDER BY RAND() LIMIT 1`;

// query to get entry info
const ENTRY_INFO_QUERY = `
  SELECT COALESCE(SE.depth, C.depth) AS depth, COALESCE(SE.length, C.length) AS length,
   IF(LOWER(RIGHT(F.path,4)) IN(
  ${VALID_IMG_FORMATS}
  )
  OR LOWER(RIGHT(F.path,5)) IN(
  ${OTHER_VALID_IMG_FORMATS}
  ),F.path,null) AS path
  FROM t_entry E
  -- to get depth and length entry info
  LEFT JOIN t_single_entry SE ON SE.id=E.id
  LEFT JOIN t_cave C ON E.Id_cave=C.id
  -- to get topo file linked to entry
  LEFT JOIN j_topo_entry JTE ON JTE.Id_entry=E.id
  LEFT JOIN j_topo_cave JTC ON JTC.Id_cave=C.id
  LEFT JOIN j_topo_file JTP ON JTP.Id_topography=COALESCE(JTE.Id_topography, JTC.Id_topography)
  LEFT JOIN t_topography T ON T.id=JTP.Id_topography
  LEFT JOIN t_file F ON F.id=JTP.Id_File
  WHERE E.id=$1 AND (T.is_public='YES' OR T.is_public IS NULL)`;

// query to count public entries
const PUBLIC_ENTRIES_COUNT_QUERY = "SELECT COUNT(id) AS count FROM t_entry WHERE Is_public='YES'";

module.exports = {
  /**
   * @returns {Promise} which resolves to the succesfully findRandom
   */
  findRandom: async () => {
    const result = await CommonService.query(RANDOM_ENTRY_QUERY, []);
    const entryId = result.rows[0].id;
    return EntryService.completeRandomEntry(entryId);
  },

  findEntry: async (entryId) => TEntry.find({ id: entryId }).limit(1),

  /**
   * @returns {Promise} which resolves to the succesfully completeRandomEntry
   */
  completeRandomEntry: async (entryId) => {
    const entryData = await this.findEntry(entryId);

    // add entry to result
    const completeEntry = { ...entryData[0] };

    // enrich result with entry info
    const entryInfo = await this.getEntryInfos(entryId);
    if (entryInfo) {
      completeEntry.entryInfo = entryInfo;
    }

    const statistics = await CommentService.getStats(entryId);
    if (statistics) {
      completeEntry.stat = statistics;
    }

    const timeInfos = await CommentService.getTimeInfos(entryId);
    if (timeInfos) {
      completeEntry.timeInfo = timeInfos;
    }

    return completeEntry;
  },

  getEntryInfos: async (entryId) => {
    const result = await CommonService.query(ENTRY_INFO_QUERY, [entryId]);
    return result.rows[0];
  },

  /**
   * @returns {Promise} which resolves to the succesfully findAllInterestEntries
   */
  findAllInterestEntries: async () => {
    const entries = await CommonService.query(INTEREST_ENTRIES_QUERY, []);

    const allEntries = [];
    const mapEntries = entries.rows.map(async (item) => {
      const entry = await EntryService.completeRandomEntry(item.id);
      allEntries.push(entry);
    });

    await Promise.all(mapEntries);
    return allEntries;
  },

  /**
   * @returns {Promise} which resolves to the succesfully query of the number of public entries
   */
  getPublicEntriesNumber: async () => {
    const result = await CommonService.query(PUBLIC_ENTRIES_COUNT_QUERY, []);
    return result.rows[0];
  },
};
