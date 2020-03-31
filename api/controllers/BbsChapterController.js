/**
 * BbsChapterController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  find: (req, res, next, converter) => {
    TBbsChapter.findOne({
      id: req.params.id,
    }).exec((err, found) => {
      const params = {};
      params.controllerMethod = 'BbsChapterController.find';
      params.searchedItem = `BbsChapter of id ${req.params.id}`;
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
    TBbsChapter.find({}).exec((err, found) => {
      const params = {
        controllerMethod: 'BbsChapterController.findAll',
        searchedItem: 'All BbsChapters',
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
