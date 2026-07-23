module.exports = async (req, res) => {
  try {
    const observationTypes = await EnumService.getObservationTypes();
    res.set('Cache-Control', `public, max-age=${EnumService.getCacheMaxAge()}`);
    return res.ok({ observationTypes });
  } catch (err) {
    sails.log.error(err);
    return res.serverError(
      'An internal error occurred while getting observation types.'
    );
  }
};
