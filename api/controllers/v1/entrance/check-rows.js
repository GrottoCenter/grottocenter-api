const { valIfTruthyOrNull } = require('../../../utils/csvHelper');

module.exports = async (req, res) => {
  const { data } = req.body || {};
  if (!Array.isArray(data)) {
    return res.badRequest({
      message: 'Missing or invalid "data" property. Expected an array.',
    });
  }

  const willBeCreated = [];
  const willBeCreatedAsDuplicates = [];
  const wontBeCreated = [];
  for (const [index, row] of data.entries()) {
    const idDbImport = valIfTruthyOrNull(row.id);
    const nameDbImport = valIfTruthyOrNull(
      row['dct:rights/cc:attributionName']
    );

    // Stop if no id or name are provided
    if (!idDbImport || !nameDbImport) {
      wontBeCreated.push({ line: index + 2 });
      continue; // eslint-disable-line no-continue
    }

    // Check for duplicates
    // eslint-disable-next-line no-await-in-loop
    const dnEntrance = await TEntrance.findOne({
      idDbImport,
      nameDbImport,
      isDeleted: false,
    });

    if (!dnEntrance) {
      willBeCreated.push(row);
    } else {
      willBeCreatedAsDuplicates.push(row);
    }
  }

  return res.ok({
    willBeCreated,
    willBeCreatedAsDuplicates,
    wontBeCreated,
  });
};
