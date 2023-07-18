/**
 * CaveController
 *
 * @description :: Server-side logic for managing Caves
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
const CaveService = require('../../../services/CaveService');
const ControllerService = require('../../../services/ControllerService');
const ErrorService = require('../../../services/ErrorService');
const { toCave } = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  const rawDescriptionsData = req.param('descriptions');
  const rawNameData = req.param('name');

  // Check params
  if (
    !rawNameData || // name is mandatory
    !rawNameData.text ||
    !rawNameData.language
  ) {
    return res.badRequest(
      'You must provide a complete name object (with attributes "text" and "language").'
    );
  }

  if (
    rawDescriptionsData // description is optional
  ) {
    for (const description of rawDescriptionsData) {
      if (!description.body || !description.language || !description.title) {
        return res.badRequest(
          'For each description, you must provide a complete description object (with attributes "body", "language" and "title").'
        );
      }
    }
  }

  // Format data
  const cleanedData = {
    ...CaveService.getConvertedDataFromClient(req),
    author: req.token.id,
    dateInscription: new Date(),
  };
  const nameData = {
    ...rawNameData,
    author: req.token.id,
    name: rawNameData.text,
  };
  const descriptionsData = rawDescriptionsData
    ? rawDescriptionsData.map((d) => ({
        ...d,
        author: req.token.id,
      }))
    : undefined;

  // Create cave
  try {
    const createdCave = await CaveService.createCave(
      req,
      cleanedData,
      nameData,
      descriptionsData
    );

    const populatedCave = await TCave.findOne(createdCave.id)
      .populate('descriptions')
      .populate('documents')
      .populate('histories')
      .populate('names');

    const params = {};
    params.controllerMethod = 'CaveController.create';
    return ControllerService.treatAndConvert(
      req,
      null,
      populatedCave,
      params,
      res,
      toCave
    );
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
