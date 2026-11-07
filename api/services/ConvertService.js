/**
 */

// iso2 is the country ISO code the front end localizes with
// Intl.DisplayNames; it is null for a world-wide projection.
const ALL_PROJ =
  'SELECT *, co.iso AS iso2\n' +
  'FROM t_crs crs\n' +
  'LEFT OUTER JOIN j_country_crs cc ON cc.id_crs = crs.id\n' +
  'LEFT OUTER JOIN t_country co ON co.iso = cc.id_country\n' +
  'ORDER BY co.native_name, crs.definition;';

const CommonService = require('./CommonService');

module.exports = {
  findAllProj: async () => CommonService.query(ALL_PROJ, []),
};
