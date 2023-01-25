const ControllerService = require('../../../services/ControllerService');
const ErrorService = require('../../../services/ErrorService');
const LocationService = require('../../../services/LocationService');

module.exports = async (req, res) => {
  try {
    const locationsHPopulated = await LocationService.getHLocationById(
      req.params.id,
      req.token
    );

    if (locationsHPopulated.error === '404') {
      return res.notFound(`Location ${req.params.id} has no snapshot.`);
    }

    if (locationsHPopulated.error === '500') {
      return res.serverError(
        'A server error occured when checking the sensitivity of the entrance.'
      );
    }

    if (locationsHPopulated.error === '401') {
      // The person is not authenticated
      return res.forbidden('You need to be logged to see this resource.');
    }

    if (locationsHPopulated.error === '403') {
      return res.forbidden(
        'You are not authorized to see the snapshots of the location.'
      );
    }

    if (locationsHPopulated.error !== null) {
      return res.serverError(locationsHPopulated.error);
    }

    if (Object.keys(locationsHPopulated.hLocations).length === 0) {
      return res.notFound(`Location ${req.params.id} has no snapshots.`);
    }

    const params = {};
    params.controllerMethod = 'GrottoController.getAllSnapshots';

    return ControllerService.treat(
      req,
      null,
      { locations: locationsHPopulated.hLocations },
      params,
      res
    );
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
