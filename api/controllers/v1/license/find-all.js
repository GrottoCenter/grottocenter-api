module.exports = async (req, res) => {
  try {
    const licenses = await TLicense.find();
    return res.ok(licenses);
  } catch (err) {
    return res.serverError(
      'There was a problem while retrieving the licenses.'
    );
  }
};
