module.exports = async (req, res) => {
  try {
    const options = await TOption.find();
    return res.ok(options);
  } catch (err) {
    return res.serverError('There was a problem while retrieving the options.');
  }
};
