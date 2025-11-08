const ControllerService = require('../../../services/ControllerService');
const CommonService = require('../../../services/CommonService');

module.exports = async (req, res) => {
  const query = req.param('query', null);
  const limit = Math.min(parseInt(req.param('limit', 10), 10), 100);
  const offset = Math.max(parseInt(req.param('offset', 0), 10), 0);
  let results = [];
  let totalCount = 0;

  if (query) {
    const fmtQuery = `%${query.replace(/_|%/g, '')}%`;

    const [isoRegions, countries, isoRegionsCount, countriesCount] =
      await Promise.all([
        CommonService.query(
          'SELECT * FROM t_iso3166_2 WHERE name ILIKE $1 OR iso ILIKE $1 LIMIT $2 OFFSET $3',
          [fmtQuery, limit, offset]
        ),
        CommonService.query(
          'SELECT * FROM t_country WHERE native_name ILIKE $1 OR iso ILIKE $1 LIMIT $2 OFFSET $3',
          [fmtQuery, limit, offset]
        ),
        CommonService.query(
          'SELECT COUNT(*) FROM t_iso3166_2 WHERE name ILIKE $1 OR iso ILIKE $1',
          [fmtQuery]
        ),
        CommonService.query(
          'SELECT COUNT(*) FROM t_country WHERE native_name ILIKE $1 OR iso ILIKE $1',
          [fmtQuery]
        ),
      ]);

    totalCount =
      parseInt(isoRegionsCount.rows[0].count, 10) +
      parseInt(countriesCount.rows[0].count, 10);

    results = [
      ...isoRegions.rows.map((e) => ({
        type: 'region',
        iso: e.iso,
        name: e.name,
      })),
      ...countries.rows.map((e) => ({
        type: 'country',
        iso: e.iso,
        name: e.native_name,
      })),
    ];
  }

  const totalPages = Math.ceil(totalCount / limit);

  const params = {
    controllerMethod: 'TRegionController.findByName',
    searchedItem: `Region with name ${req.params.name}`,
  };
  return ControllerService.treat(
    req,
    null,
    { results, totalCount, totalPages },
    params,
    res
  );
};
