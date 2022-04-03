const MappingV1Service = require('../../../services/MappingV1Service');

module.exports = (req, res) => {
  TEntrance.count({ isPublic: true })
    .then((total) =>
      res.json(MappingV1Service.convertToCountResultModel({ count: total }))
    )
    .catch((err) => {
      const errorMessage =
        'An internal error occurred when getting number of public entrances';
      sails.log.error(`${errorMessage}: ${err}`);
      return res.status(500).json({ error: errorMessage });
    });
};
