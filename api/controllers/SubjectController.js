/**
 * SubjectController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

const ControllerService = require('../services/ControllerService');

module.exports = {
  find: (req, res, next, converter) => {
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
          converter,
        );
      });
  },

  findAll: (req, res, next, converter) => {
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
          converter,
        );
      });
  },

  search: (req, res, next, converter) => {
    const orSearchArray = [];
    if (req.param('name', null)) {
      const name = req.param('name');
      /* Case insensitive search + first letter capitalized
          Example with "grot" => search with ["grot", "grot", "GROT", "Grot"]
                  with "GROT" => search with ["GROT", "grot", "GROT", "Grot"]
                  with "Grot" => search with ["Grot", "grot", "GROT", "Grot"]
            ===>  in all cases, it searches with all the possible cases
        */
      orSearchArray.push({ subject: { contains: name } });
      orSearchArray.push({
        subject: { contains: name.toLowerCase() },
      });
      orSearchArray.push({
        subject: { contains: name.toUpperCase() },
      });
      orSearchArray.push({
        subject: {
          contains: name.charAt(0).toUpperCase() + name.slice(1).toLowerCase(),
        },
      });
    }
    if (req.param('code', null)) {
      const code = req.param('code');
      orSearchArray.push({ id: { contains: code } });
    }

    TSubject.find()
      .where({
        or: orSearchArray,
      })
      .populate('parent')
      .exec((err, found) => {
        const params = {};
        params.controllerMethod = 'TSubjectController.search';
        params.searchedItem = `Subject with name ${req.param(
          'name',
        )} or code ${req.param('code')}.`;
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
