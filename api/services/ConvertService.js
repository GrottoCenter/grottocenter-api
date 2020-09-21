/**
 */

const ALL_PROJ =
  'Select * \n' +
  'FROM t_crs crs\n' +
  'LEFT OUTER JOIN j_country_crs cc ON cc.id_crs = crs.id\n' +
  'LEFT OUTER JOIN t_country co ON co.iso = cc.id_country \n' +
  'ORDER BY Fr_name, Definition ;';

module.exports = {
  findAllProj: async () => CommonService.query(ALL_PROJ, []),
};
