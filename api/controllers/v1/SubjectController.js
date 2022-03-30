/**
 */

const subjectController = require('../SubjectController');
const MappingV1Service = require('../../services/MappingV1Service');

module.exports = {
  find: (req, res, next) => subjectController.find(
    req,
    res,
    next,
    MappingV1Service.convertToSubjectModel,
  ),

  findAll: (req, res, next) => subjectController.findAll(
    req,
    res,
    next,
    MappingV1Service.convertToSubjectList,
  ),

  search: (req, res, next) => subjectController.search(
    req,
    res,
    next,
    MappingV1Service.convertToSubjectList,
  ),
};
