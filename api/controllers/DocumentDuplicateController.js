/**
 * DocumentDuplicateController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

const ErrorService = require('../services/ErrorService');
const ControllerService = require('../services/ControllerService');
const DescriptionService = require('../services/DescriptionService');
const DocumentService = require('../services/DocumentService');
const MappingV1Service = require('../services/MappingV1Service');
const RightService = require('../services/RightService');

module.exports = {
  createMany: async (req, res) => {
    const hasRight = await sails.helpers.checkRight
      .with({
        groups: req.token.groups,
        rightEntity: RightService.RightEntities.DOCUMENT_DUPLICATE,
        rightAction: RightService.RightActions.CREATE,
      })
      .intercept('rightNotFound', () => res.serverError(
        'A server error occured when checking your right to create a document duplicate.',
      ));
    if (!hasRight) {
      return res.forbidden(
        'You are not authorized to create a document duplicate.',
      );
    }

    const dateInscription = req.param('dateInscription', new Date());

    const duplicateParams = req.body.data.map((content) => ({
      dateInscription,
      content,
      document: content.document,
    }));

    await TDocumentDuplicate.createEach(duplicateParams);
    return res.ok();
  },

  createFromDuplicate: async (req, res) => {
    const hasRight = await sails.helpers.checkRight
      .with({
        groups: req.token.groups,
        rightEntity: RightService.RightEntities.DOCUMENT_DUPLICATE,
        rightAction: RightService.RightActions.CREATE,
      })
      .intercept('rightNotFound', () => res.serverError(
        'A server error occured when checking your right to create a document duplicate.',
      ));
    if (!hasRight) {
      return res.forbidden(
        'You are not authorized to create a document duplicate.',
      );
    }

    if (
      !(await sails.helpers.checkIfExists.with({
        attributeName: 'id',
        attributeValue: req.param('id'),
        sailsModel: TDocumentDuplicate,
      }))
    ) {
      return res.badRequest(
        `Could not find duplicate with id ${req.param('id')}.`,
      );
    }
    const id = req.param('id');

    const duplicate = await TDocumentDuplicate.findOne(id);

    const { document, description } = duplicate.content;
    try {
      await DocumentService.createDocument(document, description);
      await TDocumentDuplicate.destroyOne(id);
      return res.ok();
    } catch (e) {
      ErrorService.getDefaultErrorHandler(res)(e);
      return false;
    }
  },

  delete: async (req, res) => {
    const hasRight = await sails.helpers.checkRight
      .with({
        groups: req.token.groups,
        rightEntity: RightService.RightEntities.DOCUMENT_DUPLICATE,
        rightAction: RightService.RightActions.DELETE_ANY,
      })
      .intercept('rightNotFound', () => res.serverError(
        'A server error occured when checking your right to delete an document duplicate.',
      ));
    if (!hasRight) {
      return res.forbidden(
        'You are not authorized to delete a document duplicate.',
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
        sailsModel: TDocumentDuplicate,
      }))
    ) {
      return res.badRequest(
        `Could not find duplicate with id ${req.param('id')}.`,
      );
    }

    await TDocumentDuplicate.destroyOne(id);
    return res.ok();
  },

  deleteMany: async (req, res) => {
    const hasRight = await sails.helpers.checkRight
      .with({
        groups: req.token.groups,
        rightEntity: RightService.RightEntities.DOCUMENT_DUPLICATE,
        rightAction: RightService.RightActions.DELETE_ANY,
      })
      .intercept('rightNotFound', () => res.serverError(
        'A server error occured when checking your right to create a document duplicate.',
      ));
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
      await TDocumentDuplicate.destroy({
        id: idArray,
      });
      return res.ok();
    } catch (err) {
      ErrorService.getDefaultErrorHandler(res)(err);
      return false;
    }
  },

  find: async (req, res) => {
    if (
      !(await sails.helpers.checkIfExists.with({
        attributeName: 'id',
        attributeValue: req.param('id'),
        sailsModel: TDocumentDuplicate,
      }))
    ) {
      return res.badRequest(
        `Could not find duplicate with id ${req.param('id')}.`,
      );
    }
    const duplicate = await TDocumentDuplicate.findOne(
      req.param('id'),
    ).populate('author');

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
    duplicate.document = found;

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

    const popDuplicate = await DocumentService.populateJSON(duplicateDoc);
    const descLangTable = descLang
      ? await TLanguage.findOne(descLang)
      : undefined;
    popDuplicate.descriptions = [
      {
        ...duplicateDesc,
        language: descLangTable,
      },
    ];
    duplicate.content = popDuplicate;

    const params = {
      searchedItem: `Document Duplicate of id ${duplicate.id}`,
    };

    return ControllerService.treatAndConvert(
      req,
      null,
      duplicate,
      params,
      res,
      MappingV1Service.convertToDocumentDuplicateModel,
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
      const duplicates = await TDocumentDuplicate.find()
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .populate('author');
      const totalNb = await TDocumentDuplicate.count();

      const params = {
        controllerMethod: 'DocumentDuplicateController.findAll',
        limit,
        searchedItem: 'Document duplicates',
        skip,
        total: totalNb,
        url: req.originalUrl,
      };

      return ControllerService.treatAndConvert(
        req,
        null,
        duplicates,
        params,
        res,
        MappingV1Service.convertToDocumentDuplicateList,
      );
    } catch (err) {
      ErrorService.getDefaultErrorHandler(res)(err);
      return false;
    }
  },
};
