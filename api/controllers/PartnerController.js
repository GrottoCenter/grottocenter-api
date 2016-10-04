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
		TGrotto.findOneById(req.params.id).exec(function (err, found) {
			var params = {};
			params.controllerMethod = "PartnerController.find";
			params.notFoundMessage = "Partner of id " + req.params.id + " not found.";
            return ControllerService.treat(err, found, params);
        });
	},
	
	findAll: function(req, res) {
		var parameters = {};
		if (req.param('name') != undefined) {
			parameters.name = { 'like': "%" + req.param('name') + "%" };
			sails.log.debug("parameters " + parameters.name.like);
		}
		
		TGrotto.find(parameters).sort('id ASC').exec(function (err, found) {
			var params = {};
			params.controllerMethod = "PartnerController.findAll";
			params.notFoundMessage = "No partners found.";
            return ControllerService.treat(err, found, params, res);
        });
	},
	
	findForCarousel: function(req, res) {
		TGrotto.find().where({
			"customMessage" : { "!" : null },
			"pictureFileName" : { "!" : null },
			"pictureFileName" : { "!" : "" }
		}).sort('id ASC').exec(function (err, found){
			var params = {};
			params.controllerMethod = "PartnerController.findForCarousel";
			params.notFoundMessage = "No partners found.";
            return ControllerService.treat(err, found, params, res);
        });
	}
};
