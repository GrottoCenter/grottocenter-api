module.exports = async (req, res) => {
  try {
    const fileFormats = await TFileFormat.find();
    return res.ok(fileFormats);
  } catch (err) {
    return res.serverError(
      'There was a problem while retrieving the file formats.'
    );
  }
};
