/**
 * SubjectController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  find: (req, res, next, converter) => {
    TSubject.findOne({
      id: req.params.code,
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

  findByName: (req, res, next, converter) => {
    TSubject.find()
      .where({
        /* Case insensitive search + first letter capitalized
          Example with "grot" => search with ["grot", "grot", "GROT", "Grot"]
                  with "GROT" => search with ["GROT", "grot", "GROT", "Grot"]
                  with "Grot" => search with ["Grot", "grot", "GROT", "Grot"]
            ===>  in all cases, it searches with all the possible cases
        */
        or: [
          { subject: { contains: req.params.name } },
          { subject: { contains: req.params.name.toLowerCase() } },
          { subject: { contains: req.params.name.toUpperCase() } },
          {
            subject: {
              contains:
                req.params.name.charAt(0).toUpperCase() +
                req.params.name.slice(1).toLowerCase(),
            },
          },
        ],
      })
      .exec((err, found) => {
        const params = {};
        params.controllerMethod = 'TSubjectController.findByName';
        params.searchedItem = `Subject with name ${req.params.name}`;
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
