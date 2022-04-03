const doubleCheck = sails.helpers.csvhelpers.doubleCheck.with;

module.exports = async (req, res) => {
  const willBeCreated = [];
  const willBeCreatedAsDuplicates = [];
  const wontBeCreated = [];
  for (const [index, row] of req.body.data.entries()) {
    const idDb = doubleCheck.with({
      data: row,
      key: 'id',
      defaultValue: undefined,
    });
    const nameDb = doubleCheck.with({
      data: row,
      key: 'dct:rights/cc:attributionName',
      defaultValue: undefined,
    });

    // Stop if no id and name provided
    if (!(idDb && nameDb)) {
      wontBeCreated.push({
        line: index + 2,
      });
      continue; // eslint-disable-line no-continue
    }

    // Check for duplicates
    // eslint-disable-next-line no-await-in-loop
    const result = await TEntrance.find({
      idDbImport: idDb,
      nameDbImport: nameDb,
    });
    if (result.length === 0) {
      willBeCreated.push(row);
    } else {
      willBeCreatedAsDuplicates.push(row);
    }
  }

  const requestResult = {
    willBeCreated,
    willBeCreatedAsDuplicates,
    wontBeCreated,
  };
  return res.ok(requestResult);
};
