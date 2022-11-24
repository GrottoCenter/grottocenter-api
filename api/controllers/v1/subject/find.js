const ControllerService = require('../../../services/ControllerService');
const { toSubject } = require('../../../services/mapping/converters');

module.exports = (req, res) => {
  TSubject.findOne(req.param('code'))
    .populate('parent')
    .exec((err, found) => {
      const params = {};
      params.searchedItem = `Subject of code ${req.param('code')}`;
      if (!found) {
        return res.notFound(`${params.searchedItem} not found`);
      }
      params.controllerMethod = 'TSubjectController.find';
      return ControllerService.treatAndConvert(
        req,
        err,
        found,
        params,
        res,
        toSubject
      );
    });
};
