'use strict';
// query to get a random entry of interest
const RANDOM_ENTRY_QUERY = 'SELECT id FROM t_entry WHERE Is_of_interest=1 ORDER BY RAND() LIMIT 1';
// query to get entry info
const ENTRY_INFO_QUERY = 'SELECT COALESCE(SE.depth, C.depth) AS depth, COALESCE(SE.length, C.length) AS length, F.path FROM t_entry E'
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
                          + ' WHERE E.id=? and T.is_public=\'YES\'';

/**
 * @param {Model} model - an instance of a sails model
 * @param {string} sql - a sql string
 * @param {*[]} values - used to interpolate the string's ?
 *
 * @returns {Promise} which resolves to the succesfully queried strings
 */
function query(model, sql, values) {
  values = values || [];
  return new Promise((resolve, reject) => {
    model.query(sql, values, (err, results) => {
      if (err) {
        return reject(err);
      }
      resolve(results);
    });
  });
}

module.exports = {
  /**
   * @returns {Promise} which resolves to the succesfully findRandom
   */
  findRandom: function() {
    return new Promise((resolve, reject) => {
      query(TEntry, RANDOM_ENTRY_QUERY, []).then(function(results) {
        let entryId = results[0].id;

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
          query(TEntry, ENTRY_INFO_QUERY, [entryId]).then(function(entryInfo) {
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
            reject (err);
          });
        });
      });
    });
  }
};
