const ControllerService = require('../../../services/ControllerService');
const { toSubject } = require('../../../services/mapping/converters');
const { toListFromController } = require('../../../services/mapping/utils');

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
        (data) => toListFromController('subjects', data, toSubject)
      );
    });
};
