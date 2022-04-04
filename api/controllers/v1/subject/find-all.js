const ControllerService = require('../../../services/ControllerService');
const MappingV1Service = require('../../../services/MappingV1Service');

module.exports = (req, res) => {
  TSubject.find()
    .populate('parent')
    .exec((err, found) => {
      const params = {
        controllerMethod: 'TSubjectController.findAll',
        searchedItem: 'All Subjects',
      };
      return ControllerService.treatAndConvert(
        req,
        err,
        found,
        params,
        res,
        MappingV1Service.convertToSubjectList
      );
    });
};
