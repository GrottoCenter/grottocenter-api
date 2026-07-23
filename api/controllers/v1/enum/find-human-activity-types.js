module.exports = async (req, res) => {
  try {
    const humanActivityTypes = await EnumService.getHumanActivityTypes();
    res.set('Cache-Control', `public, max-age=${EnumService.getCacheMaxAge()}`);
    return res.ok({ humanActivityTypes });
  } catch (err) {
    sails.log.error(err);
    return res.serverError(
      'An internal error occurred while getting human activity types.'
    );
  }
};
