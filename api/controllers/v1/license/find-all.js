module.exports = async (req, res) =>
  res.ok({ licenses: await TLicense.find() });
