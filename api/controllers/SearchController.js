 module.exports = {

     findAll: function (req, res) {

         var parameters = {};
         if (req.param('name') != undefined) {
             parameters.name = {
                 'like': '%' + req.param('name') + '%'
             };
             sails.log.debug('Search > parameters ' + parameters.name.like);
         }

         TCave.find(parameters)
             .populate('author')
             .populate('entries')
             .sort('id ASC')
             .limit(10)
             .exec(function (err, foundCave) {

                 TEntry.find(parameters)
                     .populate('author')
                     .populate('caves')
                     .sort('id ASC')
                     .limit(10)
                     .exec(function (err, foundEntry) {
                         var params = {};
                         params.controllerMethod = 'EntryController.readAll';
                         params.notFoundMessage = 'No entries found.';
                         return ControllerService.treat(err,
                             foundCave.concat(foundEntry),
                             params,
                             res);
                     });
             });

     }
 };
