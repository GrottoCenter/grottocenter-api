/**
 */

module.exports = {
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

    const maxRange = limit;
    const range = req.param('range');

    if (range !== undefined) {
      const splitRange = range.split('-');
      limit = splitRange[1] - splitRange[0];
      skip = splitRange[0];
    }

    // TODO : to adapt when authentication will be implemented
    parameters.isPublic = 'YES';

    TEntry.count(parameters).exec((error, total) => {
      TEntry.find(parameters)
        .sort('id ASC')
        .limit(limit)
        .skip(skip)
        .exec((err, foundEntry) => {
          const params = {
            controllerMethod: 'SearchController.findAll',
            notFoundMessage: 'No entries found.',
            searchedItem: apiControl.entity,
            total,
            url: req.originalUrl,
            maxRange,
            limit,
            skip,
          };

          // only search for entries at this time
          // return ControllerService.treat(req, err, foundCave.concat(foundEntry).concat(foundGrotto), params, res);
          return ControllerService.treatAndConvert(
            req,
            err,
            foundEntry,
            params,
            res,
            converter,
          );
        });
    });
  },
};
