module.exports = async (req, res) =>
  res.ok({ fileFormats: await TFileFormat.find() });
