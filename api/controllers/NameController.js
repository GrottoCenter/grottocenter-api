/**
 * NameController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  update: async (req, res, converter) => {
    // Check right
    const hasRightOnAny = await sails.helpers.checkRight
      .with({
        groups: req.token.groups,
        rightEntity: RightService.RightEntities.NAME,
        rightAction: RightService.RightActions.EDIT_ANY,
      })
      .intercept('rightNotFound', (err) => {
        return res.serverError(
          'A server error occured when checking your right to update any name.',
        );
      });

    const hasRightOnOwn = await sails.helpers.checkRight
      .with({
        groups: req.token.groups,
        rightEntity: RightService.RightEntities.NAME,
        rightAction: RightService.RightActions.EDIT_OWN,
      })
      .intercept('rightNotFound', (err) => {
        return res.serverError(
          'A server error occured when checking your right to update your names.',
        );
      });

    // Check if name exists
    const nameId = req.param('id');
    const currentName = await TName.findOne(nameId);
    if (!currentName) {
      return res.status(404).send({
        message: `Name of id ${nameId} not found.`,
      });
    }

    const cleanedData = {
      name: req.param('name'),
      isMain: req.param('isMain'),
    };

    // Check right on this particular name
    if (!hasRightOnAny) {
      if (hasRightOnOwn) {
        if (req.token.id !== currentName.author) {
          return res.forbidden("You can not update a name you didn't created.");
        }
      } else {
        return res.forbidden('You can not update a name.');
      }
    }

    // Launch update request
    const updatedName = await TName.updateOne({
      id: nameId,
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

    const newName = await TName.findOne(nameId)
      .populate('author')
      .populate('cave')
      .populate('entrance')
      .populate('grotto')
      .populate('language')
      .populate('massif')
      .populate('reviewer');

    const params = {};
    params.controllerMethod = 'NameController.update';
    return ControllerService.treatAndConvert(
      req,
      null,
      newName,
      params,
      res,
      converter,
    );
  },
};
