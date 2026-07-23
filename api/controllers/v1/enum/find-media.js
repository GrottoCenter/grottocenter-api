module.exports = async (req, res) => {
  try {
    const media = await EnumService.getMedia();
    res.set('Cache-Control', `public, max-age=${EnumService.getCacheMaxAge()}`);
    return res.ok({ media });
  } catch (err) {
    sails.log.error(err);
    return res.serverError('An internal error occurred while getting media.');
  }
};
