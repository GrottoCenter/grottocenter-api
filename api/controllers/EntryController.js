 /**
  * EntryController
  *
  * @description :: Server-side logic for managing entries
  * @help        :: See http://links.sailsjs.org/docs/controllers
  */

 module.exports = {
   index: function(req, res) {
     TEntry.find().limit(10).exec(function(err, found) {
       return res.view({
         entrylist: found
       });
     });
   },

   find: function(req, res) {
     TEntry.findOneById(req.params.id).populate('author').populate('caves').exec(function(err, found) {
       var params = {};
       params.controllerMethod = 'EntryController.find';
       params.notFoundMessage = 'Entry of id ' + req.params.id + ' not found.';
       return ControllerService.treat(err, found, params, res);
     });
   },

   findAll: function(req, res) {
     var parameters = {};
     if (req.param('name') != undefined) {
       parameters.name = {
         'like': '%' + req.param('name') + '%'
       };
     }
     if (req.param('region') != undefined) {
       parameters.region = {
         'like': '%' + req.param('region') + '%'
       };
     }

     TEntry.find(parameters).populate('author').populate('caves').sort('id ASC').limit(10).exec(function(err, found) {
       var params = {};
       params.controllerMethod = 'EntryController.readAll';
       params.notFoundMessage = 'No entries found.';
       return ControllerService.treat(err, found, params, res);
     });
   },

   findRandom: function(req, res) {
     // TODO : entries of interest must be linked to at least one cave, so we must check data in order to avoid asap the exist subRequest
     TEntry.query('SELECT id FROM t_entry where Is_of_interest=1 and exists (select Id_entry from j_cave_entry where Id_entry=id) ORDER BY RAND() LIMIT 1', function(err, found) {
       if (err) {
         return res.serverError(err);
       }
       var entryId = found[0].id;

       TEntry.find({id:entryId}).populate('caves').populate('comments').limit(1).exec(function(err, found) {
         var params = {};
         params.controllerMethod = "EntryController.findRandom";
         params.notFoundMessage = "No entry found.";
         return ControllerService.treat(err, found, params, res);
       });
     });
   }
 };
