module.exports = async (req, res) => {
  const emailProvided = req.param('email');
  if (!emailProvided) {
    return res.badRequest('You must provide an email.');
  }

  try {
    // Rely on the ORM for input validation
    await TCaver.updateOne({ id: req.token.id }).set({
      mail: req.param('email').toLowerCase(),
    });
  } catch (_) {
    return res.badRequest();
  }

  return res.ok();
};
