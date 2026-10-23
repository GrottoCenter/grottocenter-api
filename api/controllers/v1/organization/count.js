const ControllerService = require('../../../services/ControllerService');
const {
  ORGANIZATION_TYPES,
} = require('../../../../config/constants/organization');

// The homepage counter reflects the caving community: unlike the map, it
// leaves out the organizations whose type is not set (#1924).
const COUNTED_TYPES = [
  ORGANIZATION_TYPES.SPELEOLOGY,
  ORGANIZATION_TYPES.CAVE_RESCUE,
];

module.exports = async (req, res) => {
  const count = await TGrotto.count({
    isDeleted: false,
    type: { in: COUNTED_TYPES },
  });
  const params = {
    controllerMethod: 'GrottoController.count',
  };
  return ControllerService.treat(req, null, { count }, params, res);
};
