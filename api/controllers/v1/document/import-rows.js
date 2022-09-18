const DocumentService = require('../../../services/DocumentService');
const DocumentCSVImportService = require('../../../services/DocumentCSVImportService');
const DocumentDuplicateService = require('../../../services/DocumentDuplicateService');
const RightService = require('../../../services/RightService');

const { doubleCheck } = sails.helpers.csvhelpers;

module.exports = async (req, res) => {
  const hasRight = await sails.helpers.checkRight
    .with({
      groups: req.token.groups,
      rightEntity: RightService.RightEntities.DOCUMENT,
      rightAction: RightService.RightActions.CSV_IMPORT,
    })
    .intercept('rightNotFound', () =>
      res.serverError(
        'A server error occured when checking your right to import documents via CSV.'
      )
    );
  if (!hasRight) {
    return res.forbidden('You are not authorized to import documents via CSV.');
  }

  const requestResponse = {
    type: 'document',
    total: {
      success: 0,
      failure: 0,
    },
    successfulImport: [],
    successfulImportAsDuplicates: [],
    failureImport: [],
  };

  for (const [index, data] of req.body.data.entries()) {
    // eslint-disable-next-line no-await-in-loop
    const missingColumns = await sails.helpers.csvhelpers.checkColumns.with({
      data,
    });
    // Stop if missing columnes
    if (missingColumns.length > 0) {
      requestResponse.failureImport.push({
        line: index + 2,
        message: `Columns missing : ${missingColumns.toString()}`,
      });
      continue; // eslint-disable-line no-continue
    }

    // Check for duplicates
    const idDb = doubleCheck.with({
      data,
      key: 'id',
    });
    const nameDb = doubleCheck.with({
      data,
      key: 'dct:rights/cc:attributionName',
    });

    // eslint-disable-next-line no-await-in-loop
    const result = await TDocument.find({
      idDbImport: idDb,
      nameDbImport: nameDb,
      isDeleted: false,
    });

    // Data formatting
    // Author retrieval : create one if not present in db
    // eslint-disable-next-line no-await-in-loop
    const authorId = await sails.helpers.csvhelpers.getAuthor.with({
      data,
    });
    try {
      const dataDocument =
        // eslint-disable-next-line no-await-in-loop
        await DocumentCSVImportService.getConvertedDocumentFromCsv(
          req,
          data,
          authorId
        );
      const dataLangDesc =
        DocumentCSVImportService.getConvertedLangDescDocumentFromCsv(
          data,
          authorId
        );

      if (result.length !== 0) {
        // Create a duplicate in DB
        const duplicateContent = {
          document: dataDocument,
          description: dataLangDesc,
        };
        // eslint-disable-next-line no-await-in-loop
        await DocumentDuplicateService.create(
          req.token.id,
          duplicateContent,
          result[0].id
        );
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
        dataLangDesc
      );
      // eslint-disable-next-line no-await-in-loop
      const docFiles = await TFile.find({ document: createdDocument.id });
      requestResponse.successfulImport.push({
        documentId: createdDocument.id,
        title: dataLangDesc.title,
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

  requestResponse.total.success = requestResponse.successfulImport.length;
  requestResponse.total.successfulImportAsDuplicates =
    requestResponse.successfulImportAsDuplicates.length;
  requestResponse.total.failure = requestResponse.failureImport.length;
  return res.ok(requestResponse);
};
