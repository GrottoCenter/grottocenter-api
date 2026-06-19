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

  // Validate formula length
  if (formula && formula.length > 100) {
    return res.badRequest({
      message: 'Formula must not exceed 100 characters',
    });
  }

  // Validate casNumber length
  if (casNumber && casNumber.length > 20) {
    return res.badRequest({
      message: 'CAS number must not exceed 20 characters',
    });
  }

  // Validate externalId length
  if (externalId && externalId.length > 50) {
    return res.badRequest({
      message: 'External ID must not exceed 50 characters',
    });
  }

  const data = {
    name: name.trim(),
    formula: formula || null,
    casNumber: casNumber || null,
    externalId: externalId || null,
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
  res.status(created ? 201 : 200);
  return res.json(substance);
};
