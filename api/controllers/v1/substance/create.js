const ControllerService = require('../../../services/ControllerService');
const SubstanceService = require('../../../services/SubstanceService');

module.exports = async (req, res) => {
  const name = req.param('name');
  const formula = req.param('formula');
  const casNumber = req.param('casNumber');
  const externalId = req.param('externalId');

  // Validate name: required and non-empty
  if (!name || !name.trim()) {
    return res.badRequest({ message: 'Name is required' });
  }

  // Validate name length
  if (name.trim().length > 200) {
    return res.badRequest({ message: 'Name must not exceed 200 characters' });
  }

  // Enforce externalSource logic
  const externalSource = externalId ? 'PubChem' : null;

  const data = {
    name: name.trim(),
    formula: formula || null,
    casNumber: casNumber || null,
    externalId: externalId || null,
    externalSource,
  };

  let result;
  try {
    result = await SubstanceService.createOrFind(data, req.token.id);
  } catch (err) {
    sails.log.error(err);
    return res.serverError(
      'An internal error occurred while creating the substance.'
    );
  }

  const { substance, created } = result;

  // Return 201 for newly created substances, 200 for existing duplicates
  if (created) {
    res.status(201);
    return res.json(substance);
  }

  return ControllerService.treat(
    req,
    null,
    substance,
    { controllerMethod: 'SubstanceController.create' },
    res
  );
};
