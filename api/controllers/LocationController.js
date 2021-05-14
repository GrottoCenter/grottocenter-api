/**
 * LocationController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  update: async (req, res, converter) => {
    // Check right
    const hasRight = await sails.helpers.checkRight
      .with({
        groups: req.token.groups,
        rightEntity: RightService.RightEntities.LOCATION,
        rightAction: RightService.RightActions.EDIT_ANY,
      })
      .intercept('rightNotFound', (err) => {
        return res.serverError(
          'A server error occured when checking your right to update any location.',
        );
      });
    if (!hasRight) {
      return res.forbidden('You are not authorized to update any location.');
    }

    // Check if location exists
    const locationId = req.param('id');
    const currentLocation = await TLocation.findOne(locationId);
    if (!currentLocation) {
      return res.status(404).send({
        message: `Location of id ${locationId} not found.`,
      });
    }

    const cleanedData = {
      body: req.param('body'),
    };

    // Launch update request
    const updatedLocation = await TLocation.updateOne({
      id: locationId,
    })
      .set(cleanedData)
      .intercept('E_UNIQUE', (e) => {
        sails.log.error(e.message);
        return res.status(409).send(e.message);
      })
      .intercept({ name: 'UsageError' }, (e) => {
        sails.log.error(e.message);
        return res.badRequest(e.message);
      })
      .intercept({ name: 'AdapterError' }, (e) => {
        sails.log.error(e.message);
        return res.badRequest(e.message);
      })
      .intercept((e) => {
        sails.log.error(e.message);
        return res.serverError(e.message);
      });

    const newLocation = await TLocation.findOne(locationId)
      .populate('author')
      .populate('entrance')
      .populate('language')
      .populate('reviewer');

    const params = {};
    params.controllerMethod = 'LocationController.update';
    return ControllerService.treatAndConvert(
      req,
      null,
      newLocation,
      params,
      res,
      converter,
    );
  },
};
