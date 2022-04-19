const ControllerService = require('../../../services/ControllerService');
const MappingService = require('../../../services/MappingService');

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
        MappingService.convertToSubjectList
      );
    });
};
