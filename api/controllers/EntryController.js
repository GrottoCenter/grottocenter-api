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
    }
	
};

