const { valIfTruthyOrNull } = require('../../../utils/csvHelper');

module.exports = async (req, res) => {
  const willBeCreated = [];
  const willBeCreatedAsDuplicates = [];
  const wontBeCreated = [];
  for (const [index, row] of req.body.data.entries()) {
    const idDbImport = valIfTruthyOrNull(row.id);
    const nameDbImport = valIfTruthyOrNull(
      row['dct:rights/cc:attributionName']
    );

    // Stop if no id or name provided
    if (!idDbImport || !nameDbImport) {
      wontBeCreated.push({ line: index + 2 });
      continue; // eslint-disable-line no-continue
    }

    // Check for duplicates
    // eslint-disable-next-line no-await-in-loop
    const dbDocument = await TDocument.findOne({
      idDbImport,
      nameDbImport,
      isDeleted: false,
    });
    if (!dbDocument) {
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
