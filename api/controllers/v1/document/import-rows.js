const DocumentService = require('../../../services/DocumentService');
const DocumentCSVImportService = require('../../../services/DocumentCSVImportService');
const RightService = require('../../../services/RightService');
const {
  checkColumns,
  valIfTruthyOrNull,
  getOrCreateAuthor,
} = require('../../../utils/csvHelper');

module.exports = async (req, res) => {
  const hasRight = RightService.hasGroup(
    req.token.groups,
    RightService.G.ADMINISTRATOR
  );
  if (!hasRight) {
    return res.forbidden('You are not authorized to import documents via CSV.');
  }

  const requestResponse = {
    type: 'document',
    total: {},
    successfulImport: [],
    successfulImportAsDuplicates: [],
    failureImport: [],
  };

  for (const [index, data] of req.body.data.entries()) {
    const missingColumns = checkColumns(data);
    // Stop if missing columnes
    if (missingColumns.length > 0) {
      requestResponse.failureImport.push({
        line: index + 2,
        message: `Columns missing : ${missingColumns.toString()}`,
      });
      continue; // eslint-disable-line no-continue
    }

    try {
      // Data formatting
      // Author retrieval : create one if not present in db
      // eslint-disable-next-line no-await-in-loop
      const authorId = await getOrCreateAuthor(data);
      const dataDocument =
        // eslint-disable-next-line no-await-in-loop
        await DocumentCSVImportService.getConvertedDocumentFromCsv(
          req,
          data,
          authorId
        );
      const dataDescription =
        // eslint-disable-next-line no-await-in-loop
        await DocumentCSVImportService.getConvertedDescriptionFromCsv(
          data,
          authorId
        );

      // Check for duplicates
      const idDb = valIfTruthyOrNull(data.id);
      const nameDb = valIfTruthyOrNull(data['dct:rights/cc:attributionName']);
      // eslint-disable-next-line no-await-in-loop
      const dbDocument = await TDocument.findOne({
        idDbImport: idDb,
        nameDbImport: nameDb,
        isDeleted: false,
      });
      if (dbDocument) {
        // Create a duplicate in DB
        // eslint-disable-next-line no-await-in-loop
        await TDocumentDuplicate.create({
          author: req.token.id,
          content: {
            document: dataDocument,
            description: dataDescription,
          },
          dateInscription: new Date(),
          document: dbDocument.id,
        });

        requestResponse.successfulImportAsDuplicates.push({
          line: index + 2,
          message: `Document with id ${idDb} has been created as a document duplicate.`,
        });
        continue; // eslint-disable-line no-continue
      }

      // eslint-disable-next-line no-await-in-loop
      const createdDocument = await DocumentService.createDocument(
        req,
        dataDocument,
        dataDescription,
        true
      );
      // eslint-disable-next-line no-await-in-loop
      const docFiles = await TFile.find({ document: createdDocument.id });

      requestResponse.successfulImport.push({
        documentId: createdDocument.id,
        title: dataDescription.title,
        filesImported: docFiles.map((f) => f.fileName).join(','),
      });
    } catch (err) {
      sails.log.error(err);
      requestResponse.failureImport.push({
        line: index + 2,
        message: err.toString(),
      });
    }
  }

  requestResponse.total = {
    success: requestResponse.successfulImport.length,
    successfulImportAsDuplicates:
      requestResponse.successfulImportAsDuplicates.length,
    failure: requestResponse.failureImport.length,
  };

  return res.ok(requestResponse);
};
