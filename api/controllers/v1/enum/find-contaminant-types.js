module.exports = async (req, res) => {
  try {
    const contaminantTypes = await EnumService.getContaminantTypes();
    res.set('Cache-Control', `public, max-age=${EnumService.getCacheMaxAge()}`);
    return res.ok({ contaminantTypes });
  } catch (err) {
    sails.log.error(err);
    return res.serverError(
      'An internal error occurred while getting contaminant types.'
    );
  }
};
