const ControllerService = require('../../../services/ControllerService');
const MappingService = require('../../../services/MappingService');

module.exports = (req, res) => {
  TSubject.findOne(req.param('code'))
    .populate('parent')
    .exec((err, found) => {
      const params = {};
      params.searchedItem = `Subject of code ${req.param('code')}`;
      if (!found) {
        const notFoundMessage = `${params.searchedItem} not found`;
        sails.log.debug(notFoundMessage);
        return res.status(404).send(notFoundMessage);
      }
      params.controllerMethod = 'TSubjectController.find';
      return ControllerService.treatAndConvert(
        req,
        err,
        found,
        params,
        res,
        MappingService.convertToSubjectModel
      );
    });
};
