/**
 * CaverController
 *
 * @description :: Server-side logic for managing cavers
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {
	
	index: function(req, res) {
        console.log(req._passport);
        TCaver.find().sort('id DESC').limit(10).exec(function (err, found){
            return res.view({
                caverlist: found    
            });
        });
    },

    new: function(req, res) {
        return res.view();
    },

    create: function(req, res) {
        TCaver.create(req.params.all()).exec(function (err, created) {
            if (err) {
                console.log(err);
                return res.view(500, {layout: false});
            }
            return res.redirect('/caver/');
        });
    },

    edit: function(req, res) {
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

    validate: function(req, res) {
        TCaver.update(req.param('id'), req.params.all(), function (err) {
            if (err) {
                console.log(err);
                return res.redirect('/caver/');
            }
            return res.redirect('/caver/');
        });
    },

    delete: function(req, res) {
        TCaver.findOneById(req.params.id).exec(function (err, foundCaver) {
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
        });
    }
};

