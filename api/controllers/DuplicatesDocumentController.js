/**
 * DuplicatesDocumentController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  createMany: async (req, res) => {
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

    const dateCreation = req.param('data', new Date());

    const createPromises = req.body.data.map((content) => {
      return TDuplicateDocument.create({
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
    const duplicate = await TDuplicateDocument.findOne(id);
    if (!duplicate) {
      return res.notFound();
    }

    const { document, description } = duplicate.content;
    await DocumentService.createDocument(document, description);
    await TDuplicateDocument.destroyOne(id);
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
          'A server error occured when checking your right to delete an entrance duplicate.',
        );
      });
    if (!hasRight) {
      return res.forbidden(
        'You are not authorized to delete a entrance duplicate.',
      );
    }
    const id = req.param('id');
    if (!id) {
      return res.badRequest('You must provide the id of the duplicate.');
    }

    const duplicate = await TDuplicateDocument.findOne(id);
    if (!duplicate) {
      return res.notFound();
    }

    await TDuplicateDocument.destroyOne(id);
    return res.ok();
  },

  deleteMany: async (req, res) => {
    const hasRight = await sails.helpers.checkRight
      .with({
        groups: req.token.groups,
        rightEntity: RightService.RightEntities.DOCUMENT,
        rightAction: RightService.RightActions.DELETE_ANY,
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

    const idArray = req.param('id');
    if (!idArray) {
      return res.badRequest('You must provide the id of the duplicates.');
    }

    try {
      await TDuplicateDocument.destroy({
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
    const duplicate = await TDuplicateDocument.findOne(
      req.param('id'),
    ).populate('author');

    if (!duplicate) {
      return res.notFound();
    }

    // Populate the document
    const found = await TDocument.findOne(duplicate.document)
      .populate('author')
      .populate('authorizationDocument')
      .populate('authors')
      .populate('cave')
      .populate('editor')
      .populate('entrance')
      .populate('files')
      .populate('identifierType')
      .populate('languages')
      .populate('library')
      .populate('license')
      .populate('massif')
      .populate('option')
      .populate('parent')
      .populate('regions')
      .populate('reviewer')
      .populate('subjects')
      .populate('type');
    await DescriptionService.setDocumentDescriptions(found);
    duplicate.document = MappingV1Service.convertToDocumentModel(found);

    // Populate the duplicate
    const duplicateDoc = duplicate.content.document;
    const duplicateDesc = duplicate.content.description;
    let descLang;
    if (duplicateDesc.documentMainLanguage) {
      duplicateDoc.languages = [duplicateDesc.documentMainLanguage.id];
      duplicateDesc.documentMainLanguage = undefined;
    }
    if (duplicateDesc.titleAndDescriptionLanguage) {
      descLang = duplicateDesc.titleAndDescriptionLanguage.id;
      duplicateDesc.titleAndDescriptionLanguage = undefined;
    }

    const popDuplicate = await DocumentService.populateTable(duplicateDoc);
    const descLangTable = descLang
      ? await TLanguage.findOne(descLang)
      : undefined;
    popDuplicate.descriptions = [
      {
        ...duplicateDesc,
        language: descLangTable,
      },
    ];
    duplicate.content = MappingV1Service.convertToDocumentModel(popDuplicate);

    return res.ok(duplicate);
  },

  findAll: async (req, res) => {
    const duplicates = await TDuplicateDocument.find()
      .skip(req.param('skip', 0))
      .limit(req.param('limit', 50))
      .populate('author');

    return res.ok(duplicates);
  },
};
