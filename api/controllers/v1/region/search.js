const ControllerService = require('../../../services/ControllerService');
const CommonService = require('../../../services/CommonService');

module.exports = async (req, res) => {
  const query = req.param('query', null);
  let results = [];
  if (query) {
    const fmtQuery = `%${query.replace(/_|%/g, '')}%`;

    const isoRegions = await CommonService.query(
      'SELECT * FROM t_iso3166_2 WHERE name ILIKE $1 OR iso ILIKE $1 LIMIT 10',
      [fmtQuery]
    );
    const countries = await CommonService.query(
      'SELECT * FROM t_country WHERE native_name ILIKE $1 OR iso ILIKE $1 LIMIT 10',
      [fmtQuery]
    );

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

  const params = {
    controllerMethod: 'TRegionController.findByName',
    searchedItem: `Region with name ${req.params.name}`,
  };
  return ControllerService.treat(req, null, { results }, params, res);
};
