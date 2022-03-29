/**
 * EntranceDuplicateController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  createMany: async (req, res) => {
    const hasRight = await sails.helpers.checkRight
      .with({
        groups: req.token.groups,
        rightEntity: RightService.RightEntities.ENTRANCE_DUPLICATE,
        rightAction: RightService.RightActions.CREATE,
      })
      .intercept('rightNotFound', (err) => {
        return res.serverError(
          'A server error occured when checking your right to create an entrance duplicate.',
        );
      });
    if (!hasRight) {
      return res.forbidden(
        'You are not authorized to create an entrance duplicate.',
      );
    }

    const dateInscription = req.param('dateInscription', new Date());

    const duplicateParams = req.body.data.map((content) => ({
      dateInscription: dateInscription,
      content: content,
      document: content.document,
    }));

    await TDuplicateEntrance.createEach(duplicateParams);
    return res.ok();
  },

  createFromDuplicate: async (req, res) => {
    const hasRight = await sails.helpers.checkRight
      .with({
        groups: req.token.groups,
        rightEntity: RightService.RightEntities.ENTRANCE_DUPLICATE,
        rightAction: RightService.RightActions.CREATE,
      })
      .intercept('rightNotFound', (err) => {
        return res.serverError(
          'A server error occured when checking your right to create an entrance duplicate.',
        );
      });
    if (!hasRight) {
      return res.forbidden(
        'You are not authorized to create an entrance duplicate.',
      );
    }
    if (
      !(await sails.helpers.checkIfExists.with({
        attributeName: 'id',
        attributeValue: req.param('id'),
        sailsModel: TDuplicateEntrance,
      }))
    ) {
      return res.badRequest(
        `Could not find duplicate with id ${req.param('id')}.`,
      );
    }

    const id = req.param('id');

    const duplicate = await TDuplicateEntrance.findOne(id);

    const { entrance, nameDescLoc } = duplicate.content;
    try {
      await EntranceService.createEntrance(entrance, nameDescLoc);
      await TDuplicateEntrance.destroyOne(id);
      return res.ok();
    } catch (e) {
      ErrorService.getDefaultErrorHandler(res)(e);
    }
  },

  delete: async (req, res) => {
    const hasRight = await sails.helpers.checkRight
      .with({
        groups: req.token.groups,
        rightEntity: RightService.RightEntities.ENTRANCE_DUPLICATE,
        rightAction: RightService.RightActions.DELETE_ANY,
      })
      .intercept('rightNotFound', (err) => {
        return res.serverError(
          'A server error occured when checking your right to delete an entrance duplicate.',
        );
      });
    if (!hasRight) {
      return res.forbidden(
        'You are not authorized to delete an entrance duplicate.',
      );
    }
    const id = req.param('id');
    if (!id) {
      return res.badRequest('You must provide the id of the duplicate.');
    }

    if (
      !(await sails.helpers.checkIfExists.with({
        attributeName: 'id',
        attributeValue: req.param('id'),
        sailsModel: TDuplicateEntrance,
      }))
    ) {
      return res.badRequest(
        `Could not find duplicate with id ${req.param('id')}.`,
      );
    }

    await TDuplicateEntrance.destroyOne(id);
    return res.ok();
  },

  deleteMany: async (req, res) => {
    const hasRight = await sails.helpers.checkRight
      .with({
        groups: req.token.groups,
        rightEntity: RightService.RightEntities.ENTRANCE_DUPLICATE,
        rightAction: RightService.RightActions.DELETE_ANY,
      })
      .intercept('rightNotFound', (err) => {
        return res.serverError(
          'A server error occured when checking your right to delete an entrance duplicate.',
        );
      });
    if (!hasRight) {
      return res.forbidden(
        'You are not authorized to delete an entrance duplicate.',
      );
    }
    const idArray = req.param('id');
    if (!idArray) {
      return res.badRequest('You must provide the id of the duplicates.');
    }

    try {
      await TDuplicateEntrance.destroy({
        id: idArray,
      });
      return res.ok();
    } catch (err) {
      ErrorService.getDefaultErrorHandler(res)(err);
    }
  },

  find: async (req, res) => {
    if (
      !(await sails.helpers.checkIfExists.with({
        attributeName: 'id',
        attributeValue: req.param('id'),
        sailsModel: TDuplicateEntrance,
      }))
    ) {
      return res.badRequest(
        `Could not find duplicate with id ${req.param('id')}.`,
      );
    }

    // Populate the entrance
    const duplicateFound = await TDuplicateEntrance.findOne(
      req.param('id'),
    ).populate('author');

    duplicateFound.entrance = await TEntrance.findOne(duplicateFound.entrance)
      .populate('author')
      .populate('cave')
      .populate('names')
      .populate('descriptions')
      .populate('geology')
      .populate('locations')
      .populate('documents')
      .populate('riggings')
      .populate('comments');

    // Populate the duplicate
    const duplicateEntrance = duplicateFound.content.entrance;
    const { description, location, name } = duplicateFound.content.nameDescLoc;
    const popDuplicate = await EntranceService.populateJSON(duplicateEntrance);
    if (description) {
      description.author = await TCaver.findOne(description.author);
      popDuplicate.descriptions = [description];
    }
    if (location) {
      popDuplicate.locations = [location];
    }
    if (name) {
      name.name = name.text;
      popDuplicate.names = [name];
    }

    duplicateFound.content = popDuplicate;
    const params = {
      searchedItem: `Entrance Duplicate of id ${duplicateFound.id}`,
    };

    return ControllerService.treatAndConvert(
      req,
      null,
      duplicateFound,
      params,
      res,
      MappingV1Service.convertToEntranceDuplicateModel,
    );
  },

  findAll: async (req, res) => {
    const sort = `${req.param('sortBy', 'dateInscription')} ${req.param(
      'orderBy',
      'ASC',
    )}`;
    const limit = req.param('limit', 50);
    const skip = req.param('skip', 0);
    try {
      const duplicates = await TDuplicateEntrance.find()
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .populate('author');
      const totalNb = await TDuplicateEntrance.count();

      const params = {
        controllerMethod: 'EntranceDuplicateController.findAll',
        limit: limit,
        searchedItem: 'Entrance duplicates',
        skip: skip,
        total: totalNb,
        url: req.originalUrl,
      };

      return ControllerService.treatAndConvert(
        req,
        null,
        duplicates,
        params,
        res,
        MappingV1Service.convertToEntranceDuplicateList,
      );
    } catch (err) {
      ErrorService.getDefaultErrorHandler(res)(err);
    }
  },
};