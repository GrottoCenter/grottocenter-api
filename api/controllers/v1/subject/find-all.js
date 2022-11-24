const ControllerService = require('../../../services/ControllerService');
const {
  convertToSubjectModel,
} = require('../../../services/mapping/MappingService');
const {
  convertToListFromController,
} = require('../../../services/mapping/utils');

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
        (data) =>
          convertToListFromController('subjects', data, convertToSubjectModel)
      );
    });
};
