/**
 */

const partnerController = require('../PartnerController');

module.exports = {
  findForCarousel: (req, res, next) => partnerController.findForCarousel(
    req,
    res,
    next,
    MappingV1Service.convertToOrganizationModel,
  ),
  count: (req, res) => partnerController.count(req, res),
};
