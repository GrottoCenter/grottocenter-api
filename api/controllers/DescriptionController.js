/**
 * DescriptionController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  create: async (req, res, converter) => {
    // Check right
    const hasRight = await sails.helpers.checkRight
      .with({
        groups: req.token.groups,
        rightEntity: RightService.RightEntities.DESCRIPTION,
        rightAction: RightService.RightActions.CREATE,
      })
      .intercept('rightNotFound', (err) => {
        return res.serverError(
          'A server error occured when checking your right to create a description.',
        );
      });
    if (!hasRight) {
      return res.forbidden('You are not authorized to create a description.');
    }

    // Check params
    if (!req.param('body')) {
      return res.badRequest(`You must provide a body to create a description.`);
    }
    if (!req.param('language')) {
      return res.badRequest(
        `You must provide a language id to create a description.`,
      );
    }
    if (!req.param('title')) {
      return res.badRequest(
        `You must provide a title to create a description.`,
      );
    }

    const possibleEntities = [
      {
        id: req.param('caveId'),
        sailsModel: TCave,
        type: 'cave',
      },
      {
        id: req.param('documentId'),
        sailsModel: TDocument,
        type: 'document',
      },
      {
        id: req.param('entranceId'),
        sailsModel: TEntrance,
        type: 'entrance',
      },
      {
        id: req.param('exitId'),
        sailsModel: TEntrance,
        type: 'exit',
      },
      {
        id: req.param('massifId'),
        sailsModel: TMassif,
        type: 'massif',
      },
      {
        id: req.param('pointId'),
        sailsModel: TPoint,
        type: 'point',
      },
    ];

    const describedEntity = possibleEntities.find(
      (possibleEntity) => possibleEntity.id !== undefined,
    );

    // No entity id provided handling
    if (!describedEntity) {
      const lastItem = possibleEntities.pop();
      return res.badRequest(
        `You must provide an existing entity id such as ${possibleEntities
          .map((e) => e.type)
          .join('Id, ')} or ${lastItem.type}Id.`,
      );
    }

    const doesEntityExists = await sails.helpers.checkIfExists.with({
      attributeName: 'id',
      attributeValue: describedEntity.id,
      sailsModel: describedEntity.sailsModel,
    });

    // Entity not found handling
    if (!doesEntityExists) {
      return res.status(404).send({
        message: `The ${describedEntity.type} with id ${describedEntity.id} was not found.`,
      });
    }

    const newDescription = await TDescription.create({
      author: req.token.id,
      dateInscription: new Date(),
      body: req.param('body'),
      title: req.param('title'),
      language: req.param('language'),
      [describedEntity.type]: describedEntity.id,
    })
      .fetch()
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

    const newDescriptionPopulated = await TDescription.findOne(
      newDescription.id,
    )
      .populate('author')
      .populate('cave')
      .populate('document')
      .populate('entrance')
      .populate('exit')
      .populate('language')
      .populate('massif');

    const params = {};
    params.controllerMethod = 'DescriptionController.create';
    return ControllerService.treatAndConvert(
      req,
      null,
      newDescriptionPopulated,
      params,
      res,
      converter,
    );
  },
  update: async (req, res, converter) => {
    // Check right
    const hasRightOnAny = await sails.helpers.checkRight
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

    const hasRightOnOwn = await sails.helpers.checkRight
      .with({
        groups: req.token.groups,
        rightEntity: RightService.RightEntities.DESCRIPTION,
        rightAction: RightService.RightActions.EDIT_OWN,
      })
      .intercept('rightNotFound', (err) => {
        return res.serverError(
          'A server error occured when checking your right to update your descriptions.',
        );
      });

    // Check if description exists
    const descriptionId = req.param('id');
    const currentDescription = await TDescription.findOne(descriptionId);
    if (!currentDescription) {
      return res.status(404).send({
        message: `Description of id ${descriptionId} not found.`,
      });
    }

    const cleanedData = {
      body: req.param('body'),
      title: req.param('title'),
    };

    // Check right on this particular description
    if (!hasRightOnAny) {
      if (hasRightOnOwn) {
        if (req.token.id !== currentDescription.author) {
          return res.forbidden(
            "You can not update a description you didn't created.",
          );
        }
      } else {
        return res.forbidden('You can not update a description.');
      }
    }

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
