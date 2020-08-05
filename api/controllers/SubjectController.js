/**
 * SubjectController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  find: (req, res, next, converter) => {
    TSubject.findOne({
      code: req.params.code,
    }).exec((err, found) => {
      const params = {};
      params.controllerMethod = 'TSubjectController.find';
      params.searchedItem = `Subject of code ${req.params.code}`;
      return ControllerService.treatAndConvert(
        req,
        err,
        found,
        params,
        res,
        converter,
      );
    });
  },

  findAll: (req, res, next, converter) => {
    TSubject.find().exec((err, found) => {
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
        converter,
      );
    });
  },
};
