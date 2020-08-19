/**
 */

const subjectController = require('../SubjectController');

module.exports = {
  find: (req, res, next) =>
    subjectController.find(
      req,
      res,
      next,
      MappingV1Service.convertToSubjectModel,
    ),

  findAll: (req, res, next) =>
    subjectController.findAll(
      req,
      res,
      next,
      MappingV1Service.convertToSubjectList,
    ),
};
