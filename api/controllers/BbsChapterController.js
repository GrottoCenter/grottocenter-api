/**
 * BbsChapterController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

'use strict';
module.exports = {
    find: function(req, res, next, converter) {
        TBbsChapter.findOne({
            id: req.params.id
        }).exec(function(err, found) {
            let params = {};
            params.controllerMethod = 'BbsChapterController.find';
            params.searchedItem = 'BbsChapter of id ' + req.params.id;
            return ControllerService.treatAndConvert(req, err, found, params, res, converter);
        });
    },

    findAll: function(req, res, next, converter) {
        TBbsChapter.find({}).exec(function(err, found) {
            let params = {
                controllerMethod: 'BbsChapterController.findAll',
                searchedItem: 'All BbsChapters',
            };
            return ControllerService.treatAndConvert(req, err, found, params, res, converter);
        });
    },
};

