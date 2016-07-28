 /**
 * EntryController
 *
 * @description :: Server-side logic for managing entries
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {

	index: function(req, res) {
        TEntry.find().limit(10).exec(function (err, found){
            return res.view({
                entrylist: found    
            });
        });
    },
	
	readAll: function(req, res) {
		var parameters = {};
		if (req.param('name') != undefined) {
			parameters.name = { 'like': "%" + req.param('name') + "%" };
		}
		if (req.param('region') != undefined) {
			parameters.region = { 'like': "%" + req.param('region') + "%" };
		}
			
		TEntry.find(parameters).populate('author').populate('caves').sort('id ASC').limit(10).exec(function (err, found){
			if (err) {
                console.log(err);
                return res.badRequest('EntryController.readAll error: ' + err);
            }
			if (!found) {
                console.log("No entries found.");
                return res.badRequest("No entries found.");
            }
            return res.json(found);
        });
	}
	
};

