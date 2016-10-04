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

  read: function(req, res) {
    TGrotto.findOneById(req.params.id).exec(function(err, found) {
      if (err) {
        console.log(err);
        return res.badRequest('PartnerController.read error: ' + err);
      }
      if (!found) {
        console.log("Partner of id " + req.params.id + " not found.");
        return res.badRequest("Partner of id " + req.params.id + " not found.");
      }
      return res.json(found);
    });
  },

  update: function(req, res) {
    return res.badRequest('PartnerController.update not yet implemented!');
  },

  delete: function(req, res) {
    return res.badRequest('PartnerController.delete not yet implemented!');
  },

  readAll: function(req, res) {
    TGrotto.find().sort('id ASC').exec(function(err, found) {
      if (err) {
        console.log(err);
        return res.badRequest('PartnerController.readAll error: ' + err);
      }
      if (!found) {
        console.log("No partners found.");
        return res.badRequest("No partners found.");
      }
      return res.json(found);
    });
  },

  findForCarousel: function(req, res) {
    TGrotto.find().where({
      "customMessage": {
        "!": null
      },
      "pictureFileName": {
        "!": null
      },
      "pictureFileName": {
        "!": ""
      },
      "isPartner": "YES"
    }).sort('id ASC').exec(function(err, found) {
      if (err) {
        console.log(err);
        return res.badRequest('PartnerController.readAll error: ' + err);
      }
      if (!found) {
        console.log("No partners found.");
        return res.badRequest("No partners found.");
      }
      return res.json(found);
    });
  }
};
