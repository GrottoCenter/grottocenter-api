'use strict';
// valid image formats
const VALID_IMG_FORMATS = "\'.jpg\',\'.png\',\'.gif\',\'.svg\'";
// query to get all entries of interest
const INTEREST_ENTRIES_QUERY = 'SELECT id FROM t_entry WHERE Is_of_interest=1';
// query to get a random entry of interest
const RANDOM_ENTRY_QUERY = INTEREST_ENTRIES_QUERY + ' ORDER BY RAND() LIMIT 1';
// query to get entry info
const ENTRY_INFO_QUERY = 'SELECT COALESCE(SE.depth, C.depth) AS depth, COALESCE(SE.length, C.length) AS length,'
                          + ' IF(LOWER(RIGHT(F.path,4)) IN(' + VALID_IMG_FORMATS + '),F.path,null) AS path'
                          + ' FROM t_entry E'
                          // to get depth and length entry info
                          + ' LEFT JOIN t_single_entry SE ON SE.id=E.id'
                          + ' LEFT JOIN j_cave_entry JCE ON JCE.Id_entry=E.id'
                          + ' LEFT JOIN t_cave C ON JCE.Id_cave=C.id'
                          // to get topo file linked to entry
                          + ' LEFT JOIN j_topo_entry JTE ON JTE.Id_entry=E.id'
                          + ' LEFT JOIN j_topo_cave JTC ON JTC.Id_cave=C.id'
                          + ' LEFT JOIN j_topo_file JTP ON JTP.Id_topography=COALESCE(JTE.Id_topography, JTC.Id_topography)'
                          + ' LEFT JOIN t_topography T ON T.id=JTP.Id_topography'
                          + ' LEFT JOIN t_file F ON F.id=JTP.Id_File'
                          + ' WHERE E.id=? AND (T.is_public=\'YES\' OR T.is_public IS NULL)';

module.exports = {
  /**
   * @returns {Promise} which resolves to the succesfully findRandom
   */
  findRandom: function() {
    return new Promise((resolve, reject) => {
      CommonService.query(TEntry, RANDOM_ENTRY_QUERY, []).then(function(results) {
        let entryId = results[0].id;
        EntryService.completeRandomEntry(entryId).then(function(entry) {
          // resolve entry at last
          resolve(entry);
        }, function(err) {
          // when no entry info found, reject
          reject(err);
        });
      });
    });
  },

  /**
   * @returns {Promise} which resolves to the succesfully completeRandomEntry
   */
  completeRandomEntry: function(entryId) {
    return new Promise((resolve, reject) => {
      let result = [];
      TEntry.find({
        id: entryId
      }).limit(1).exec(function(err, found) {
        if (err) {
          return reject(err);
        }
        // add entry to result
        result.push(found[0]);
        // enrich result with entry info
        CommonService.query(TEntry, ENTRY_INFO_QUERY, [entryId]).then(function(entryInfo) {
          if (entryInfo !== undefined) {
            result[0]['entryInfo'] = entryInfo;
          }
          // add stats
          CommentService.getStats(entryId).then(function(statistics) {
            if (statistics !== undefined) {
              result[0]['stat'] = statistics;
            }
            // add time to go and underground time
            CommentService.getTimeInfos(entryId).then(function(timeInfos) {
              if (timeInfos !== undefined) {
                result[0]['timeInfo'] = timeInfos;
              }
              // resolve result at last
              resolve(result);
            });
          });
        }, function(err) {
          // when no entry info found, reject
          reject(err);
        });
      });
    });
  },

  /**
   * @returns {Promise} which resolves to the succesfully findAllInterestEntries
   */
  findAllInterestEntries: function() {
    return new Promise((resolve, reject) => {
      CommonService.query(TEntry, INTEREST_ENTRIES_QUERY, []).then(function(results) {
        let allEntries = [];
        let mapEntries = results.map(function(item) {
          return EntryService.completeRandomEntry(item.id).then(function(entry) {
            allEntries.push(entry);
          });
        });
        Promise.all(mapEntries).then(() => {
          resolve(allEntries);
        });
      }, function(err) {
        // when no entry info found, reject
        reject(err);
      });
    });
  }
};
