const CaveService = require('../../../services/CaveService');
const EntranceService = require('../../../services/EntranceService');
const EntranceCSVImportService = require('../../../services/EntranceCSVImportService');
const RightService = require('../../../services/RightService');
const {
  checkColumns,
  valIfTruthyOrNull,
  getOrCreateAuthor,
} = require('../../../utils/csvHelper');

const ENTRANCE_MANDATORY_COLUMNS = [
  'w3geo:latitude',
  'w3geo:longitude',
  'rdfs:label/dc:language',
];

module.exports = async (req, res) => {
  const hasRight = RightService.hasGroup(
    req.token.groups,
    RightService.G.ADMINISTRATOR
  );
  if (!hasRight) {
    return res.forbidden('You are not authorized to import entrances via CSV.');
  }

  const requestResponse = {
    type: 'entrance',
    total: {
      success: 0,
      failure: 0,
    },
    successfulImport: [],
    successfulImportAsDuplicates: [],
    failureImport: [],
  };

  /* eslint-disable no-await-in-loop */
  for (const [index, data] of req.body.data.entries()) {
    const missingColumns = await checkColumns(data, ENTRANCE_MANDATORY_COLUMNS);

    // Stop if missing columnes
    if (missingColumns.length > 0) {
      requestResponse.failureImport.push({
        line: index + 2,
        message: `Columns missing : ${missingColumns.toString()}`,
      });
      continue; // eslint-disable-line no-continue
    }

    // Check for duplicates
    const idDb = valIfTruthyOrNull(data.id);
    const nameDb = valIfTruthyOrNull(data['dct:rights/cc:attributionName']);

    try {
      // Get data
      // Author retrieval: create one if not present in db
      const authorId = await getOrCreateAuthor(data);
      const dataNameDescLoc =
        await EntranceCSVImportService.getConvertedNameDescLocEntranceFromCsv(
          data,
          authorId
        );

      const result = await TEntrance.findOne({
        idDbImport: idDb,
        nameDbImport: nameDb,
      });
      if (result) {
        // Create a duplicate in DB
        const cave = await TCave.findOne(result.cave);
        const entrance = EntranceCSVImportService.getConvertedEntranceFromCsv(
          data,
          authorId,
          cave
        );

        await TEntranceDuplicate.create({
          author: req.token.id,
          content: {
            entrance,
            nameDescLoc: dataNameDescLoc,
          },
          dateInscription: new Date(),
          entrance: result.id,
        });

        requestResponse.successfulImportAsDuplicates.push({
          line: index + 2,
          message: `Entrance with id ${idDb} has been created as an entrance duplicate.`,
        });
        continue; // eslint-disable-line no-continue
      }

      // Cave creation
      const dataCave = EntranceCSVImportService.getConvertedCaveFromCsv(
        data,
        authorId
      );
      const nameData =
        EntranceCSVImportService.getConvertedNameAndDescCaveFromCsv(
          data,
          authorId
        );
      const createdCave = await CaveService.createCave(req, dataCave, nameData);

      // Entrance creation
      const dataEntrance = EntranceCSVImportService.getConvertedEntranceFromCsv(
        data,
        authorId,
        createdCave
      );
      const { dateInscription } = dataEntrance;
      const { dateReviewed } = dataEntrance;

      const createdEntrance = await EntranceService.createEntrance(
        req,
        dataEntrance,
        dataNameDescLoc
      );
      if (valIfTruthyOrNull(data['gn:alternateName'])) {
        await TName.create({
          author: authorId,
          entrance: createdEntrance.id,
          dateInscription,
          dateReviewed,
          isMain: false,
          language: dataNameDescLoc.name.language,
          name: data['gn:alternateName'].name,
        });
      }

      requestResponse.successfulImport.push({
        caveId: createdCave.id,
        entranceId: createdEntrance.id,
        latitude: createdEntrance.latitude,
        longitude: createdEntrance.longitude,
      });
    } catch (err) {
      sails.log.error(err);
      requestResponse.failureImport.push({
        line: index + 2,
        message: err.toString(),
      });
    }
  }
  /* eslint-enable no-await-in-loop */

  requestResponse.total.success = requestResponse.successfulImport.length;
  requestResponse.total.successfulImportAsDuplicates =
    requestResponse.successfulImportAsDuplicates.length;
  requestResponse.total.failure = requestResponse.failureImport.length;
  return res.ok(requestResponse);
};
