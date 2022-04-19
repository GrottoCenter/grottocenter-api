const MappingService = require('../../../services/MappingService');

module.exports = (req, res) => {
  TEntrance.count({ isPublic: true })
    .then((total) =>
      res.json(MappingService.convertToCountResultModel({ count: total }))
    )
    .catch((err) => {
      const errorMessage =
        'An internal error occurred when getting number of public entrances';
      sails.log.error(`${errorMessage}: ${err}`);
      return res.status(500).json({ error: errorMessage });
    });
};
