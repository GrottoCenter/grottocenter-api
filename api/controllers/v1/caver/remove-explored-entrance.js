module.exports = async (req, res) => {
  const caverId = req.token.id;
  const entranceId = req.param('entranceId');

  const entrance = await TEntrance.findOne({ id: entranceId });
  if (!entrance) {
    return res.badRequest(`Could not find entrance with id ${entranceId}.`);
  }

  await TCaver.removeFromCollection(caverId, 'exploredEntrances', entranceId);
  return res.ok();
};
