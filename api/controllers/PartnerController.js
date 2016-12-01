/**
 * PartnerController.js
 *
 * @description :: Management of GC partners
 * @docs        :: http://sailsjs.org/#!documentation/controllers
 */

module.exports = {
  create: function(req, res) {
    return res.badRequest('PartnerController.create not yet implemented!');
  },

  update: function(req, res) {
    return res.badRequest('PartnerController.update not yet implemented!');
  },

  delete: function(req, res) {
    return res.badRequest('PartnerController.delete not yet implemented!');
  },

  find: function(req, res) {
    TGrotto.findOneById(req.params.id).exec(function(err, found) {
      var params = {};
      params.controllerMethod = 'PartnerController.find';
      params.notFoundMessage = 'Partner of id ' + req.params.id + ' not found.';
      return ControllerService.treat(err, found, params);
    });
  },

  findAll: function(req, res) {
    var parameters = {};
    if (req.param('name') != undefined) {
      parameters.name = {
        'like': '%' + req.param('name') + '%'
      };
      sails.log.debug('parameters ' + parameters.name.like);
    }

    TGrotto.find(parameters).sort('id ASC').exec(function(err, found) {
      var params = {};
      params.controllerMethod = 'PartnerController.findAll';
      params.notFoundMessage = 'No partners found.';
      return ControllerService.treat(err, found, params, res);
    });
  },

  findForCarousel: function(req, res) {
    var skip = 0;
    if (req.param('skip') != undefined && req.param('skip') != "") {
      skip = req.param('skip');
    }
    var limit = 20;
    if (req.param('limit') != undefined && req.param('limit') != "") {
      limit = req.param('limit');
    }
    TGrotto.find({ select: ['id', 'name', 'pictureFileName', 'customMessage'] }).skip(skip).limit(limit).sort('id ASC').where({
      'customMessage': {
        '!': null
      },
      'pictureFileName': {
        '!': null
      },
      'pictureFileName': {
        '!': ''
      },
      'isOfficialPartner': '1'
    }).sort('id ASC').exec(function(err, found) {
      var params = {};
      params.controllerMethod = 'PartnerController.findForCarousel';
      params.notFoundMessage = 'No partners found.';
      return ControllerService.treat(err, found, params, res);
    });
  }
};
