/**
 * CaveController
 *
 * @description :: Server-side logic for managing Caves
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
const CaveService = require('../../../services/CaveService');
const ControllerService = require('../../../services/ControllerService');
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

  // description is optional
  if (rawDescriptionsData) {
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
  const populatedCave = await CaveService.createCave(
    req,
    cleanedData,
    nameData,
    descriptionsData
  );

  return ControllerService.treatAndConvert(
    req,
    null,
    populatedCave,
    { controllerMethod: 'CaveController.create' },
    res,
    toCave
  );
};
