/**
 * DescriptionController
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
        rightEntity: RightService.RightEntities.DESCRIPTION,
        rightAction: RightService.RightActions.EDIT_ANY,
      })
      .intercept('rightNotFound', (err) => {
        return res.serverError(
          'A server error occured when checking your right to update any description.',
        );
      });
    if (!hasRight) {
      return res.forbidden('You are not authorized to update any description.');
    }

    // Check if description exists
    const descriptionId = req.param('id');
    const currentDescription = await TDescription.findOne(descriptionId);
    if (!currentDescription) {
      return res.status(404).send({
        message: `Description of id ${descriptionId} not found.`,
      });
    }

    const cleanedData = {
      body: req.param('body') ? req.param('body') : currentDescription.body,
      title: req.param('title') ? req.param('title') : currentDescription.title,
    };

    // Launch update request
    const updatedDescription = await TDescription.updateOne({
      id: descriptionId,
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

    const newDescription = await TDescription.findOne(descriptionId)
      .populate('author')
      .populate('cave')
      .populate('document')
      .populate('entrance')
      .populate('exit')
      .populate('language')
      .populate('massif')
      .populate('reviewer');

    const params = {};
    params.controllerMethod = 'DescriptionController.update';
    return ControllerService.treatAndConvert(
      req,
      null,
      newDescription,
      params,
      res,
      converter,
    );
  },
};
