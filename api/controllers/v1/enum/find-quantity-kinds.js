module.exports = async (req, res) => {
  try {
    const quantityKinds = await EnumService.getQuantityKinds();
    res.set('Cache-Control', `public, max-age=${EnumService.getCacheMaxAge()}`);
    return res.ok({ quantityKinds });
  } catch (err) {
    sails.log.error(err);
    return res.serverError(
      'An internal error occurred while getting quantity kinds.'
    );
  }
};
