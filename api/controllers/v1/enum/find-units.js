module.exports = async (req, res) => {
  try {
    const units = await EnumService.getUnits();
    res.set('Cache-Control', `public, max-age=${EnumService.getCacheMaxAge()}`);
    return res.ok({ units });
  } catch (err) {
    sails.log.error(err);
    return res.serverError('An internal error occurred while getting units.');
  }
};
