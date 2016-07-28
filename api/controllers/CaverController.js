/**
 * CaverController
 *
 * @description :: Server-side logic for managing cavers
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {
	
	find: function(req, res) {
		return res.badRequest('CaverController.find not yet implemented!');
        /*TCaver.find().sort('id DESC').limit(10).exec(function (err, found){
			if (err) {
                return res.json({success: false, message: err});
            }
            if (!found) {
                return res.json({success: false, message: "Cave of id " + req.params.id + " not found."});
            }
            return res.json(found);
        });*/
    },

    create: function(req, res) {
		return res.badRequest('CaverController.create not yet implemented!');
       /* TCaver.create(req.params.all()).exec(function (err, created) {
            if (err) {
                return res.json({success: false, message: err});
                //return res.view(500, {layout: false});
            }
            return res.json({success: true, message: ""});
        });*/
    },

	/*
    update: function(req, res) {
        TCaver.findOneById(req.params.id).exec(function (err, foundCaver) {
            if (err) {
                console.log(err);
                return res.view(404, {layout: false});
            }
            if (!foundCaver) {
                console.log("User of id " + req.params.id + " not found.");
                return res.redirect('/caver/');
            }
            return res.view({
                caver: foundCaver
            });
        });
    },
	*/

    update: function(req, res) {
		return res.badRequest('CaverController.update not yet implemented!');
		
        /*TCaver.update(req.param('id'), req.params.all(), function (err) {
            if (err) {
                console.log(err);
                return res.json({success: false, message: err});
            }
            return res.json({success: true, message: "Caver " + req.param('id') + " updated"});
        });*/
    },

    destroy: function(req, res) {
		return res.badRequest('CaverController.destroy not yet implemented!');
        /*TCaver.findOneById(req.params.id).exec(function (err, foundCaver) {
            if (err) {
                console.log(err);
                return res.redirect('/caver/');
            }
            if (err) {
                console.log("Caver not found");
                return res.redirect('/caver/');
            }
            TCaver.destroy(foundCaver.id, function(err) {
                if (err) {
                    console.log(err);
                    return res.redirect('/caver/');
                }
                return res.redirect('/caver/');
            });
        });*/
    }
};

