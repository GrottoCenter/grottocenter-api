/**
 */

const partnerController = require('../PartnerController');
const MappingV1Service = require('../../services/MappingV1Service');

module.exports = {
  findForCarousel: (req, res, next) => partnerController.findForCarousel(
    req,
    res,
    next,
    MappingV1Service.convertToOrganizationModel,
  ),
  count: (req, res) => partnerController.count(req, res),
};
