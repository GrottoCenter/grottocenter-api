/**
 * AdminController
 */

module.exports = {
  index: (req, res) => {
    TEntry.find()
      .limit(10)
      .exec((err, found) => {
        return res.view({
          entrylist: found,
        });
      });
  },

  find: (req, res) => {
    TEntry.findOneById(req.params.id)
      .populate('author')
      .populate('cave')
      .populate('singleEntry')
      .exec((err, found) => {
        const params = {};
        params.controllerMethod = 'EntryController.find';
        params.notFoundMessage = `Entry of id ${req.params.id} not found.`;
        return ControllerService.treat(req, err, found, params, res);
      });
  },

  findAll: (req, res) => {
    const parameters = {};
    if (req.param('name')) {
      parameters.name = {
        like: `%${req.param('name')}%`,
      };
    }
    if (req.param('region')) {
      parameters.region = {
        like: `%${req.param('region')}%`,
      };
    }

    TEntry.find(parameters)
      .populate('author')
      .populate('cave')
      .populate('singleEntry')
      .sort('id ASC')
      .limit(10)
      .exec((err, found) => {
        const params = {};
        params.controllerMethod = 'EntryController.findAll';
        params.notFoundMessage = 'No entries found.';
        return ControllerService.treat(req, err, found, params, res);
      });
  },

  findAllInterestEntries: (req, res) => {
    EntryService.findAllInterestEntries().then(
      (results) => {
        if (!results) {
          return res.notFound();
        }
        return res.json(results);
      },
      (err) => {
        sails.log.error(err);
        return res.serverError(
          `EntryController.findAllRandomEntry error : ${err}`,
        );
      },
    );
  },
};
