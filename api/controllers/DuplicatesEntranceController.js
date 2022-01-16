/**
 * DuplicatesEntranceController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  createMany: async (req, res) => {
    //Same right as entrance, because a duplicate may only exist if a entrance is created.
    const hasRight = await sails.helpers.checkRight
      .with({
        groups: req.token.groups,
        rightEntity: RightService.RightEntities.DOCUMENT,
        rightAction: RightService.RightActions.EDIT_ANY,
      })
      .intercept('rightNotFound', (err) => {
        return res.serverError(
          'A server error occured when checking your right to create a document duplicate.',
        );
      });
    if (!hasRight) {
      return res.forbidden(
        'You are not authorized to create a document duplicate.',
      );
    }

    const dateCreation = req.param('data', new Date());

    const createPromises = req.body.data.map((content) => {
      return TDuplicateEntrance.create({
        date: dateCreation,
        content: content,
        document: content.document,
      });
    });

    await Promise.all(createPromises);
    return res.ok();
  },

  createNewEntityFromDuplicate: async (req, res) => {
    //Same right as document, because a duplicate may only exist if a document is created.
    const hasRight = await sails.helpers.checkRight
      .with({
        groups: req.token.groups,
        rightEntity: RightService.RightEntities.DOCUMENT,
        rightAction: RightService.RightActions.EDIT_ANY,
      })
      .intercept('rightNotFound', (err) => {
        return res.serverError(
          'A server error occured when checking your right to create a document duplicate.',
        );
      });
    if (!hasRight) {
      return res.forbidden(
        'You are not authorized to create a document duplicate.',
      );
    }
    const id = req.param('id');
    const duplicate = await TDuplicateEntrance.findOne(id);
    if (!duplicate) {
      return res.notFound();
    }

    const { entrance, nameDescLoc } = duplicate.content;
    const a = await EntranceService.createEntrance(entrance, nameDescLoc);
    await TDuplicateEntrance.destroyOne(id);
    return res.ok();
  },

  delete: async (req, res) => {
    const hasRight = await sails.helpers.checkRight
      .with({
        groups: req.token.groups,
        rightEntity: RightService.RightEntities.ENTRANCE,
        rightAction: RightService.RightActions.DELETE_ANY,
      })
      .intercept('rightNotFound', (err) => {
        return res.serverError(
          'A server error occured when checking your right to delete a document duplicate.',
        );
      });
    if (!hasRight) {
      return res.forbidden(
        'You are not authorized to delete a document duplicate.',
      );
    }
    const id = req.param('id');
    if (!id) {
      return res.badRequest('You must provide the id of the duplicate.');
    }

    const duplicate = await TDuplicateEntrance.findOne(id);
    if (!duplicate) {
      return res.notFound();
    }

    await TDuplicateEntrance.destroyOne(id);
    return res.ok();
  },

  deleteMany: async (req, res) => {
    const hasRight = await sails.helpers.checkRight
      .with({
        groups: req.token.groups,
        rightEntity: RightService.RightEntities.ENTRANCE,
        rightAction: RightService.RightActions.DELETE_ANY,
      })
      .intercept('rightNotFound', (err) => {
        return res.serverError(
          'A server error occured when checking your right to delete a document duplicate.',
        );
      });
    if (!hasRight) {
      return res.forbidden(
        'You are not authorized to delete a document duplicate.',
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
      return res.serverError(
        'An error occured while trying to delete the duplicates.',
      );
    }
  },

  find: async (req, res) => {
    // Populate the entrance
    const duplicateFound = await TDuplicateEntrance.findOne(
      req.param('id'),
    ).populate('author');

    if (!duplicateFound) {
      return res.notFound();
    }

    const entranceFound = await TEntrance.findOne(duplicateFound.entrance)
      .populate('author')
      .populate('cave')
      .populate('names')
      .populate('descriptions')
      .populate('geology')
      .populate('locations')
      .populate('documents')
      .populate('riggings')
      .populate('comments');

    duplicateFound.entrance = MappingV1Service.convertToEntranceModel(
      entranceFound,
    );

    // Populate the duplicate
    const duplicateEntrance = duplicateFound.content.entrance;
    const { description, location, name } = duplicateFound.content.nameDescLoc;
    const popDuplicate = await EntranceService.populateTable(duplicateEntrance);
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

    duplicateFound.content = MappingV1Service.convertToEntranceModel(
      popDuplicate,
    );
    return res.ok(duplicateFound);
  },

  findAll: async (req, res) => {
    const duplicates = await TDuplicateEntrance.find()
      .skip(req.param('skip', 0))
      .limit(req.param('limit', 50))
      .populate('author');

    return res.ok(duplicates);
  },
};
