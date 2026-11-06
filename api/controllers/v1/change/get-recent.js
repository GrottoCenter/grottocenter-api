const ControllerService = require('../../../services/ControllerService');
const RecentChangeService = require('../../../services/RecentChangeService');
const readRecentChangeFilters = require('../../../utils/recentChangeFilters');

// Model holding the referenced record of each filter, to answer 404 when absent
const FILTER_MODELS = {
  countryId: { model: () => TCountry, label: 'Country' },
  regionId: { model: () => TISO31662, label: 'Region' },
  massifId: { model: () => TMassif, label: 'Massif' },
  organizationId: { model: () => TGrotto, label: 'Organization' },
};

module.exports = async (req, res) => {
  const { filters, error } = readRecentChangeFilters((name) => req.param(name));
  if (error) {
    return res.badRequest(
      sails.helpers.formatStructuredError(req, error.message, 'E_BAD_REQUEST', {
        field: error.field,
        value: error.value,
      })
    );
  }

  const missing = (
    await Promise.all(
      Object.entries(filters).map(async ([name, value]) => {
        const { model, label } = FILTER_MODELS[name];
        const found = await model().findOne({
          where: { id: value },
          select: ['id'],
        });
        return found ? null : `${label} ${value} not found.`;
      })
    )
  ).find(Boolean);
  if (missing) return res.notFound({ message: missing });

  let offset = parseInt(req.param('offset'), 10);
  if (Number.isNaN(offset)) offset = 0;
  let limit = parseInt(req.param('limit'), 10);
  if (Number.isNaN(limit)) limit = 10;
  const start = offset >= 0 ? offset : offset - limit;
  const end = offset >= 0 ? offset + limit : offset;

  const changes = await RecentChangeService.getRecent(filters);

  return ControllerService.treat(
    req,
    null,
    { changes: changes.slice(start, end) },
    {
      controllerMethod: 'ChangeController.getRecent',
      notFoundMessage: 'Problem while getting the recent changes',
    },
    res
  );
};
