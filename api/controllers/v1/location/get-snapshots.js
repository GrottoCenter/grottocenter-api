const ControllerService = require('../../../services/ControllerService');
const ErrorService = require('../../../services/ErrorService');
const LocationService = require('../../../services/LocationService');

module.exports = async (req, res) => {
  try {
    const locationsHPopulated = await LocationService.getHLocationById(
      req.params.id,
      req.token
    );

    if (locationsHPopulated === '404') {
      return res.notFound(`Location ${req.params.id} has no snapshot.`);
    }

    if (locationsHPopulated === '500') {
      return res.serverError(
        'A server error occured when checking the sensitivity of the entrance.'
      );
    }

    if (locationsHPopulated === '401') {
      // The person is not authenticated
      return res.forbidden('You need to be logged to see this resource.');
    }

    if (locationsHPopulated === '403') {
      return res.forbidden(
        'You are not authorized to see the snapshots of the location.'
      );
    }

    if (Object.keys(locationsHPopulated).length === 0) {
      return res.notFound(`Location ${req.params.id} has no snapshots.`);
    }

    const params = {};
    params.controllerMethod = 'GrottoController.getAllSnapshots';

    return ControllerService.treat(
      req,
      null,
      { locations: locationsHPopulated },
      params,
      res
    );
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
