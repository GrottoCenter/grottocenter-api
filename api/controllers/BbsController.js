/**
 * BbsController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  find: (req, res, next, converter) => {
    TBbs.findOne({
      id: req.params.id,
    })
      .populate('country')
      .populate('chapter')
      .populate('lib')
      .exec((err, found) => {
        const params = {};
        params.controllerMethod = 'BbsController.find';
        params.searchedItem = `BBS of id ${req.params.id}`;
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

  count: (req, res) => {
    TBbs.count().exec((err, found) => {
      const params = {};
      params.controllerMethod = 'BbsController.count';
      params.notFoundMessage = 'Problem while getting number of bbs.';

      const count = {};
      count.count = found;
      return ControllerService.treat(req, err, count, params, res);
    });
  },
};
