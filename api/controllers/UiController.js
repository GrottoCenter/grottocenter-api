/**
 * UiController
 *
 * @description :: Server-side logic for managing the user interface of GC3
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

	index: function(req, res) {
        return res.view();
    },
	
	login: function(req, res) {
		if (req.session.authenticated == true) {
            res.redirect("/ui/");
            return;
        }
        res.view();
	},
	
	cavelist: function(req, res) {
        return res.view();
    },
	
	entryList: function(req, res) {
        return res.view();
    }

};

