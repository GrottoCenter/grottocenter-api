const MappingService = require('../../../services/MappingService');

module.exports = (req, res) => {
  TEntrance.count({ isPublic: true })
    .then((total) =>
      res.json(MappingService.convertToCountResultModel({ count: total }))
    )
    .catch((err) =>
      res.serverError({
        error: err,
        message:
          'An internal error occurred when getting number of public entrances',
      })
    );
};
