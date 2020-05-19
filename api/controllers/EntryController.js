/**
 * EntryController
 *
 * @description :: Server-side logic for managing entries
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {
  find: (req, res, converter) => {
    TEntry.findOne({
      id: req.params.id,
      // TODO : to adapt when authentication will be implemented
      isPublic: 'YES',
      // TODO before this : see how to materialize fact that
      // id of entry corresponds to id of linked single entry if exists
      // }).populate('author').populate('cave').populate('singleEntry').exec(function(err, found) {
    })
      .populate('author')
      .populate('cave')
      .exec((err, found) => {
        const params = {};
        params.searchedItem = `Entry of id ${req.params.id}`;
        return ControllerService.treatAndConvert(
          req,
          err,
          found,
          params,
          res,
          converter,
        );
      });
  },

  findByCountry: (req, res, converter) => {
    TEntry.find({
      select: ['country', 'region', 'county', 'city', 'latitude', 'longitude'],
      where: {
        country: req.param('country'),
      },
      sort: 'id asc',
    }).then(
      (results) => {
        if (!results) {
          return res.notFound();
        }
        return res.json(results);
      },
      (err) => {
        sails.log.error(err);
        return res.serverError(`EntryController.findRandom error ${err}`);
      },
    );
  },

  findAll: (req, res, converter) => {
    const apiControl = req.options.api;
    const parameters = {};
    let { limit } = apiControl;
    let skip = 0;

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

    const maxRange = apiControl.limit;
    const range = req.param('range');

    if (range !== undefined) {
      const splitRange = range.split('-');
      limit = splitRange[1] - splitRange[0];
      skip = splitRange[0];
    }

    // TODO : to adapt when authentication will be implemented
    parameters.isPublic = 'YES';

    // TODO before this : see how to materialize fact that
    // id of entry corresponds to id of linked single entry if exists
    // TEntry.find(parameters).populate('author').populate('cave').populate('singleEntry').sort('id ASC').limit(10).exec(function(err, found) {
    TEntry.count(parameters).exec((error, total) => {
      TEntry.find(parameters)
        .populate('author')
        .populate('cave')
        .sort('id ASC')
        .limit(limit)
        .skip(skip)
        .exec((err, found) => {
          const params = {
            controllerMethod: 'EntryController.findAll',
            notFoundMessage: 'No entries found.',
            searchedItem: apiControl.entity,
            total,
            url: req.originalUrl,
            maxRange,
            limit,
            skip,
          };

          return ControllerService.treatAndConvert(
            req,
            err,
            found,
            params,
            res,
            converter,
          );
        });
    });
  },

  findRandom: (req, res) => {
    EntryService.findRandom().then(
      (results) => {
        if (!results) {
          return res.notFound();
        }
        return res.json(results);
      },
      (err) => {
        sails.log.error(err);
        return res.serverError(`EntryController.findRandom error ${err}`);
      },
    );
  },

  getPublicEntriesNumber: (req, res, converter) => {
    EntryService.getPublicEntriesNumber()
      .then((count) => {
        if (!count) {
          return res
            .status(404)
            .json({ error: 'Problem while getting number of public entries' });
        }
        return res.json(converter(count));
      })
      .catch((err) => {
        const errorMessage =
          'An internal error occurred when getting number of public entries';
        sails.log.error(`${errorMessage}: ${err}`);
        return res.status(500).json({ error: errorMessage });
      });
  },

  getEntriesNumber: (req, res) => {
    TEntry.count().exec((err, found) => {
      const params = {};
      params.controllerMethod = 'EntryController.getEntriesNumber';
      params.notFoundMessage = 'Problem while getting number of entries.';

      const count = {};
      count.count = found;
      return ControllerService.treat(req, err, count, params, res);
    });
  },

  updateEntryAdministrative: (req, res) => {
    const { county, id, country, region, city } = req.body;
    TEntry.updateOne({ id: id })
      .set({ county: county, country: country, region: region, city: city })
      .exec((err, found) => {
        if (err) {
          return res.json({ msg: 'Update failed for row : ' + id });
        } else {
          return res.json(found);
        }
      });
  },
};
