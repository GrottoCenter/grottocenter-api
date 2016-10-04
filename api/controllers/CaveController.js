/**
 * CaveController
 *
 * @description :: Server-side logic for managing Caves
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

  create: function(req, res) {
    return res.badRequest('CaveController.create not yet implemented!');
  },

  findOneById: function(req, res) {
    TCave.findOneById(req.params.id).populate('author').populate('entries').populate('topographies').exec(function(err, found) {
      if (err) {
        console.log(err);
        return res.badRequest('CaveController.read error: ' + err);
      }
      if (!found) {
        console.log("Cave of id " + req.params.id + " not found.");
        return res.badRequest("Cave of id " + req.params.id + " not found.");
      }
      return res.json(found);
    });
  },

  update: function(req, res) {
    return res.badRequest('CaveController.update not yet implemented!');
  },

  delete: function(req, res) {
    return res.badRequest('CaveController.delete not yet implemented!');
  },

  findAll: function(req, res) {
    var parameters = {};
    if (req.param('name') != undefined) {
      parameters.name = {
        'like': "%" + req.param('name') + "%"
      };
      sails.log.debug("parameters " + parameters.name.like);
    }

    TCave.find(parameters).populate('author').populate('entries').sort('id ASC').limit(10).exec(function(err, found) {
      if (err) {
        console.log(err);
        return res.badRequest('CaveController.readAll error: ' + err);
      }
      if (!found) {
        console.log("No caves found.");
        return res.badRequest("No caves found.");
      }
      return res.json(found);
    });
  },

  findRandom: function(req, res) {
    TCave.find().populate('author').populate('entries').sort('id ASC').limit(1).exec(function(err, found) {
      if (err) {
        console.log(err);
        return res.badRequest('CaveController.readAll error: ' + err);
      }
      if (!found) {
        console.log("No caves found.");
        return res.badRequest("No caves found.");
      }
      return res.json(found);
    });
  }
};
