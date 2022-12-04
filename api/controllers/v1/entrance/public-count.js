module.exports = (req, res) => {
  TEntrance.count({ isPublic: true })
    .then((count) => res.json({ count }))
    .catch((err) =>
      res.serverError({
        error: err,
        message:
          'An internal error occurred when getting number of public entrances',
      })
    );
};
