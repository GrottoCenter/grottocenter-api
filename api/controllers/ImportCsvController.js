/**
 * ImportCsvController
 *
 * @description :: Server-side logic for managing the import from csv
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

const getCountryISO3 = require('country-iso-2-to-3');

const CaveService = require('../services/CaveService');
const EntranceService = require('../services/EntranceService');
const ElasticsearchService = require('../services/ElasticsearchService');
const DocumentService = require('../services/DocumentService');

const esClient = require('../../config/elasticsearch').elasticsearchCli;
const GrottoService = require('../services/GrottoService');

const iso2ToIso3 = (iso) => {
  if (iso !== undefined) {
    if (iso === 'EN') {
      return 'eng';
    }
    const res = getCountryISO3(iso);
    if (res) {
      return res.toLowerCase();
    } else {
      throw Error('This iso code is incorrect : ' + iso);
    }
  }
  return null;
};

const retrieveFromLink = (stringArg) => {
  const string = stringArg.trim();
  return string.startsWith('http') ? string.split('#')[1] : string;
};
/**
 *
 * @param {Object} data struct containing the data to check
 * @param {string} key the key which may or may not be present in data
 * @param {any} defaultValue the default value to return if something goes wrong
 * @param {Function} fn function applied to the returned value (optional)
 *
 * @returns the default value if data doesn't contain the key, or if the value associated is an empty string. Else returns the value.
 */
const doubleCheck = (data, key, defaultValue, fn = (v) => v) => {
  return data[key] && data[key] !== '' ? fn(data[key]) : defaultValue;
};

/**
 *
 * @param {string} fullName the complete name
 * @returns an array of 3 string : the full name, the name and the surname. If the name is too long (happens when it is not a person) we only return the full name.
 */
const getPersonData = (fullName) => {
  const creatorArray = fullName.split(' ');
  if (creatorArray.length <= 3) {
    const creatorName = creatorArray[0];
    let creatorSurname = '';
    for (let i = 1; i < creatorArray.length; i++) {
      creatorSurname += creatorArray[i] + ' ';
    }
    creatorSurname = creatorSurname.slice(0, -1);
    return [fullName, creatorName, creatorSurname];
  } else {
    return [fullName, undefined, undefined];
  }
};

/**
 *
 * @param {*} data the csv line
 * returns the id which will be used for the column id_author of the tables.
 * If an author is provided, check if it is in the db, else create it.
 * If an author is not provided, use the database name from which comes the data as the author. Same behavior than with a regular author.
 */
const getAuthor = async (data) => {
  let authorId;
  let author = doubleCheck(
    data,
    'karstlink:hasDescriptionDocument/dct:creator',
    null,
  );
  let authorName, authorSurname;
  if (!author) {
    author = doubleCheck(data, 'dct:rights/cc:attributionName', undefined);
  }
  const [authorFullName, name, surname] = getPersonData(author);
  author = authorFullName;
  authorName = name;
  authorSurname = surname;
  // const esRes = await ElasticsearchService.searchQuery({
  //   query: author,
  //   resourceTypes: ['cavers'],
  // });
  // if(esRes.hits.total.value === 0) {
  const authorCaver = await TCaver.find({
    nickname: author,
  }).limit(1);
  if (authorCaver.length === 0) {
    const caverParams = {
      name: authorName,
      surname: authorSurname,
      nickname: author,
    };
    const newCaver = await CaverService.createNonUserCaver(
      caverParams,
      handleError,
      esClient,
    );
    authorId = newCaver.id;
  } else {
    //  authorId = esRes.hits.hits[0]['_source'].id;
    authorId = authorCaver[0].id;
  }
  return authorId;
};

/**
 *
 * @param {string} creator the name of the creator. It can be an URI.
 * @returns a promise of the caver data concerning this creator.
 */
const getCreator = async (creator) => {
  const creatorNickname = retrieveFromLink(creator).replace('_', ' ');
  // const searchCreatorParams = {
  //       query: creatorNickname,
  //       resourceTypes: ['cavers'],
  //     };

  //     return ElasticsearchService.searchQuery(searchCreatorParams).then(async (result) => {
  //       const caversArray = result.hits.hits;
  const caversArray = await TCaver.find({
    nickname: creatorNickname,
  }).limit(1);
  let caver;
  switch (caversArray.length) {
    case 0:
      const [fullName, creatorName, creatorSurname] = getPersonData(
        creatorNickname,
      );
      const paramsCaver = {
        name: creatorName,
        surname: creatorSurname,
        nickname: fullName,
      };
      caver = await CaverService.createNonUserCaver(
        paramsCaver,
        handleError,
        esClient,
      );
      break;
    default:
      // caver = caversArray[0]['_source'];
      caver = caversArray[0];
      break;
  }
  return caver;
};

const handleError = (error) => {
  return error;
};

const getConvertedCaveFromClient = (rawData, idAuthor) => {
  let depth = doubleCheck(rawData, 'karstlink:verticalExtend', undefined);
  if (!depth) {
    depth =
      parseInt(doubleCheck(rawData, 'karstlink:extendBelowEntrance', 0), 10) +
      parseInt(doubleCheck(rawData, 'karstlink:extendAboveEntrance', 0), 10);
  }
  return {
    // The TCave.create() function doesn't work with TCave field alias. See TCave.js Model
    /* eslint-disable camelcase */
    id_author: idAuthor,
    latitude: doubleCheck(rawData, 'w3geo:latitude', undefined),
    longitude: doubleCheck(rawData, 'w3geo:longitude', undefined),
    length: doubleCheck(rawData, 'karstlink:length', undefined),
    depth: depth,
    date_inscription: doubleCheck(
      rawData,
      'dct:rights/dct:created',
      new Date(),
    ),
    date_reviewed: doubleCheck(rawData, 'dct:rights/dct:modified', undefined),
  };
};

const getConvertedNameAndDescCaveFromClient = (rawData, authorId) => {
  return {
    author: authorId,
    name: doubleCheck(rawData, 'rdfs:label', undefined),
    descriptionAndNameLanguage: {
      id: doubleCheck(
        rawData,
        'karstlink:hasDescriptionDocument/dc:language',
        undefined,
        iso2ToIso3,
      ),
    },
    dateInscription: doubleCheck(rawData, 'dct:rights/dct:created', new Date()),
    dateReviewed: doubleCheck(rawData, 'dct:rights/dct:modified', undefined),
  };
  //No description provided by the csv
};

const getConvertedEntranceFromClient = (rawData, idAuthor, cave) => {
  return {
    author: idAuthor,
    country: doubleCheck(rawData, 'gn:countryCode', undefined),
    precision: doubleCheck(rawData, 'dwc:coordinatePrecision', undefined),
    altitude: doubleCheck(rawData, 'w3geo:altitude', undefined),
    latitude: cave.latitude,
    longitude: cave.longitude,
    cave: cave.id,
    dateInscription: doubleCheck(rawData, 'dct:rights/dct:created', new Date()),
    dateReviewed: doubleCheck(rawData, 'dct:rights/dct:modified', undefined),
    isOfInterest: false,
    idDbImport: doubleCheck(rawData, 'id', undefined),
    nameDbImport: doubleCheck(
      rawData,
      'dct:rights/cc:attributionName',
      undefined,
    ),
    //Default value, never provided by csv import
    geology: 'Q35758',
  };
};

const getConvertedNameDescLocEntranceFromClient = async (rawData, authorId) => {
  let result = {};
  if (
    doubleCheck(
      rawData,
      'karstlink:hasDescriptionDocument/dct:title',
      undefined,
    )
  ) {
    result = {
      description: {
        body: doubleCheck(
          rawData,
          'karstlink:hasDescriptionDocument/dct:description',
          undefined,
        ),
        language: doubleCheck(
          rawData,
          'karstlink:hasDescriptionDocument/dc:language',
          undefined,
          iso2ToIso3,
        ),
        title: doubleCheck(
          rawData,
          'karstlink:hasDescriptionDocument/dct:title',
          undefined,
        ),
        author: authorId,
        dateInscription: doubleCheck(
          rawData,
          'dct:rights/dct:created',
          new Date(),
        ),
        dateReviewed: doubleCheck(
          rawData,
          'dct:rights/dct:modified',
          undefined,
        ),
      },
    };
  }

  if (doubleCheck(rawData, 'rdfs:label', undefined)) {
    result = {
      ...result,
      name: {
        author: authorId,
        text: rawData['rdfs:label'],
        language: doubleCheck(rawData, 'gn:countryCode', undefined, iso2ToIso3),
        dateInscription: doubleCheck(
          rawData,
          'dct:rights/dct:created',
          new Date(),
        ),
        dateReviewed: doubleCheck(
          rawData,
          'dct:rights/dct:modified',
          undefined,
        ),
      },
    };
  }
  if (
    doubleCheck(
      rawData,
      'karstlink:hasAccessDocument/dct:description',
      undefined,
    )
  ) {
    let authorLoc = authorId;
    const authorFromCsv = doubleCheck(
      rawData,
      'karstlink:hasAccessDocument/dct:creator',
      undefined,
    );
    if (authorFromCsv) {
      const auth = await getCreator(authorFromCsv);
      authorLoc = auth.id;
    }
    result = {
      ...result,
      location: {
        body: rawData['karstlink:hasAccessDocument/dct:description'],
        title: doubleCheck(
          rawData,
          'karstlink:hasAccessDocument/dct:description',
          undefined,
        ),
        language: doubleCheck(
          rawData,
          'karstlink:hasAccessDocument/dc:language',
          undefined,
          iso2ToIso3,
        ),
        author: authorLoc,
        dateInscription: doubleCheck(
          rawData,
          'dct:rights/dct:created',
          new Date(),
        ),
        dateReviewed: doubleCheck(
          rawData,
          'dct:rights/dct:modified',
          undefined,
        ),
      },
    };
  }
  return result;
};

const getDocumentType = (url) => {
  if (url.includes('art', 'article')) return 18;
  if (url.includes('doc', 'document')) return 12;
  if (url.includes('img', 'image')) return 4;
  return 18;
};

const getConvertedDocumentFromClient = async (rawData, authorId) => {
  const rawLicence = doubleCheck(
    rawData,
    'dct:rights/karstlink:licenseType',
    undefined,
  );
  const licence = retrieveFromLink(rawLicence);
  const licenceDb = await TLicense.findOne({ name: licence });
  if (licenceDb) {
    const creatorsRaw = rawData['dct:creator'].split('|');
    //For each creator, we first check if there is a grotto of this name. If not, check for a caver. If not, create a caver.
    const creatorsPromises = creatorsRaw.map(async (creatorRaw) => {
      const authorGrotto = await TName.find({
        name: retrieveFromLink(creatorRaw),
        grotto: { '!=': null },
      }).limit(1);
      if (authorGrotto.length === 0) {
        return { type: 'caver', value: await getCreator(creatorRaw) };
      } else {
        return { type: 'grotto', value: authorGrotto[0] };
      }
    });

    const editorsRaw = doubleCheck(rawData, 'dct:publisher', null);
    let editorId = undefined;
    if (editorsRaw) {
      const editorsRawArray = editorsRaw.split('|');
      let editorName = '';
      for (const editorRaw of editorsRawArray) {
        editorName += retrieveFromLink(editorRaw).replace('_', ' ') + ', ';
      }
      editorName = editorName.slice(0, -2);
      const namesArray = await TName.find({
        name: editorName,
        grotto: { '!=': null },
      }).limit(1);
      switch (namesArray.length) {
        case 0:
          const paramsGrotto = {
            author: authorId,
            dateInscription: new Date(),
          };
          const nameGrotto = {
            text: editorName,
            language: doubleCheck(rawData, 'gn:countryCode', 'ENG', iso2ToIso3),
            author: authorId,
          };
          const editorGrotto = await GrottoService.createGrotto(
            paramsGrotto,
            nameGrotto,
            handleError,
            esClient,
          );
          editorId = editorGrotto.id;
          break;
        default:
          const name = namesArray[0];
          editorId = name.grotto;
          break;
      }
    }

    const typeData = doubleCheck(rawData, 'karstlink:documentType', undefined);
    let typeId = undefined;
    if (typeData) {
      const typeCriteria = typeData.startsWith('http')
        ? { url: typeData }
        : { name: typeData };
      const type = await TType.findOne(typeCriteria);
      if (!type) {
        throw Error('This document type is incorrect : ' + typeData);
      }
      typeId = type.id;
    }

    const parentData = doubleCheck(rawData, 'dct:isPartOf', undefined);
    let parent = undefined;
    if (parentData) {
      const descArray = await TDescription.find({
        title: parentData,
        document: { '!=': null },
      }).limit(1);
      if (parrentArray.length > 0) {
        parent = descArray[0].document;
      }
    }

    const subjectsData = doubleCheck(rawData, 'dct:subject', undefined);
    let subjects = undefined;
    if (subjectsData) {
      subjects = subjectsData.split('|');
    }

    const creators = await Promise.all(creatorsPromises);
    const creatorsCaverId = [];
    const creatorsGrottoId = [];
    for (const creator of creators) {
      switch (creator.type) {
        case 'caver':
          creatorsCaverId.push(creator.value.id);
          break;
        case 'grotto':
          creatorsGrottoId.push(creator.value.id);
          break;
      }
    }

    return {
      author: authorId,
      datePublication: doubleCheck(rawData, 'dct:date', undefined),
      type: doubleCheck(
        rawData,
        'karstlink:documentType',
        undefined,
        getDocumentType,
      ),
      identifierType: doubleCheck(rawData, 'dct:identifier', undefined),
      identifier: doubleCheck(rawData, 'dct:source', undefined),
      license: licenceDb.id,
      dateInscription: doubleCheck(
        rawData,
        'dct:rights/dct:created',
        new Date(),
      ),
      dateReviewed: doubleCheck(rawData, 'dct:rights/dct:modified', undefined),
      authors: creatorsCaverId,
      authorsGrotto: creatorsGrottoId,
      editor: editorId,
      type: typeId,
      parent: parent,
      subjects: subjects,
      idDbImport: doubleCheck(rawData, 'id', undefined),
      nameDbImport: doubleCheck(
        rawData,
        'dct:rights/cc:attributionName',
        undefined,
      ),
    };
  } else {
    throw Error('This kind of license cannot be imported.');
  }
};

const getConvertedLangDescDocumentFromClient = (rawData, authorId) => {
  const desc = doubleCheck(
    rawData,
    'karstlink:hasDescriptionDocument/dct:description',
    undefined,
  );
  const langDesc = desc
    ? doubleCheck(
        rawData,
        'karstlink:hasDescriptionDocument/dc:language',
        undefined,
        iso2ToIso3,
      )
    : doubleCheck(rawData, 'dc:language', undefined, iso2ToIso3);
  return {
    author: authorId,
    title: doubleCheck(rawData, 'rdfs:label', undefined),
    description: doubleCheck(
      rawData,
      'karstlink:hasDescriptionDocument/dct:description',
      undefined,
    ),
    dateInscription: doubleCheck(rawData, 'dct:rights/dct:created', new Date()),
    dateReviewed: doubleCheck(rawData, 'dct:rights/dct:modified', undefined),
    documentMainLanguage: {
      id: doubleCheck(rawData, 'dc:language', undefined, iso2ToIso3),
    },
    titleAndDescriptionLanguage: {
      id: langDesc,
    },
  };
};

module.exports = {
  checkAll: async (req, res) => {
    let model;
    switch (req.body.typeRow) {
      case 'document':
        model = TDocument;
        break;
      case 'entrance':
        model = TEntrance;
        break;
      default:
        return res.serverError();
    }
    const willBeCreated = [];
    const wontBeCreated = [];
    for (const [index, row] of req.body.data.entries()) {
      const idDb = doubleCheck(row, 'id', undefined);
      const nameDb = doubleCheck(
        row,
        'dct:rights/cc:attributionName',
        undefined,
      );
      if (!(idDb && nameDb)) {
        wontBeCreated.push({
          line: index + 2,
        });
      } else {
        const result = await model.find({
          idDbImport: idDb,
          nameDbImport: nameDb,
        });
        if (result.length > 0) {
          wontBeCreated.push({
            line: index + 2,
          });
        } else {
          willBeCreated.push(row);
        }
      }
    }

    const requestResult = {
      willBeCreated,
      wontBeCreated,
    };
    return res.ok(requestResult);
  },

  importAll: async (req, res) => {
    const requiredColumns = [
      'id',
      'rdf:type',
      'dct:rights/cc:attributionName',
      'dct:rights/karstlink:licenseType',
      'gn:countryCode',
    ];
    const requiredLocationColumns = [
      'karstlink:hasAccessDocument/dct:description',
      'karstlink:hasAccessDocument/dc:language',
      'karstlink:hasAccessDocument/dct:creator',
    ];
    const requiredDescriptionColumns = [
      'karstlink:hasDescriptionDocument/dct:title',
      'karstlink:hasDescriptionDocument/dct:creator',
      'karstlink:hasDescriptionDocument/dc:language',
    ];
    const requestResponse = {
      type: '',
      total: {
        success: 0,
        failure: 0,
      },
      successfulImport: [],
      failureImport: [],
    };
    let hasRight;
    let executeFunction;
    switch (req.body.typeRow) {
      case 'document':
        requestResponse.type = 'document';
        hasRight = await sails.helpers.checkRight
          .with({
            groups: req.token.groups,
            rightEntity: RightService.RightEntities.DOCUMENT,
            rightAction: RightService.RightActions.EDIT_ANY,
          })
          .intercept('rightNotFound', (err) => {
            return res.serverError(
              'A server error occured when checking your right to create a document.',
            );
          });
        if (!hasRight) {
          return res.forbidden('You are not authorized to create a document.');
        }
        executeFunction = async (data) => {
          const authorId = await getAuthor(data);
          const dataDocument = await getConvertedDocumentFromClient(
            data,
            authorId,
          );
          const dataLangDesc = getConvertedLangDescDocumentFromClient(
            data,
            authorId,
          );
          const documentCreated = await DocumentService.createDocument(
            dataDocument,
            dataLangDesc,
            handleError,
          );
          return {
            documentId: documentCreated.id,
          };
        };
        break;
      case 'entrance':
        requiredColumns.push('w3geo:latitude', 'w3geo:longitude');
        requestResponse.type = 'entrance';
        hasRight = await sails.helpers.checkRight
          .with({
            groups: req.token.groups,
            rightEntity: RightService.RightEntities.ENTRANCE,
            rightAction: RightService.RightActions.CREATE,
          })
          .intercept('rightNotFound', (err) => {
            return res.serverError(
              'A server error occured when checking your right to create an entrance.',
            );
          });
        if (!hasRight) {
          return res.forbidden('You are not authorized to delete an entrance.');
        }
        executeFunction = async (data) => {
          //Author retrieval : create one if not present in db
          const authorId = await getAuthor(data);

          //Cave creation
          const dataCave = getConvertedCaveFromClient(data, authorId);
          const dataNameAndDesc = getConvertedNameAndDescCaveFromClient(
            data,
            authorId,
          );
          const caveCreated = await CaveService.createCave(
            dataCave,
            dataNameAndDesc,
            handleError,
          );

          //Entrance creation
          const dataEntrance = getConvertedEntranceFromClient(
            data,
            authorId,
            caveCreated,
          );
          const { dateInscription } = dataEntrance;
          const { dateReviewed } = dataEntrance;
          const dataNameDescLoc = await getConvertedNameDescLocEntranceFromClient(
            data,
            authorId,
          );
          const entranceCreated = await EntranceService.createEntrance(
            dataEntrance,
            dataNameDescLoc,
            handleError,
            esClient,
          );
          if (doubleCheck(data, 'gn:alternateName', null)) {
            await TName.create({
              author: authorId,
              entrance: entranceCreated.id,
              dateInscription: dateInscription,
              dateReviewed: dateReviewed,
              isMain: false,
              language: dataNameDescLoc.name.language,
              name: data['gn:alternateName'].name,
            });
          }
          return { caveId: caveCreated.id, entranceId: entranceCreated.id };
        };
        break;
      default:
        return res.serverError('Incorrect type.');
    }
    for (const [index, data] of req.body.data.entries()) {
      let cond = true;
      const missingColumns = [];
      for (const requiredColumn of requiredColumns) {
        if (!doubleCheck(data, requiredColumn, false)) {
          missingColumns.push(requiredColumn);
          cond = false;
        }
      }
      if (
        doubleCheck(data, 'karstlink:hasDescriptionDocument/dct:title', false)
      ) {
        for (const requiredDescColumn of requiredDescriptionColumns) {
          if (!doubleCheck(data, requiredDescColumn, false)) {
            cond = false;
            missingColumns.push(requiredDescColumn);
          }
        }
      }
      if (
        doubleCheck(data, 'karstlink:hasAccessDocument/dct:description', false)
      ) {
        for (const requiredLocColumn of requiredLocationColumns) {
          if (!doubleCheck(data, requiredLocColumn, false)) {
            cond = false;
            missingColumns.push(requiredLocColumn);
          }
        }
      }

      if (cond) {
        try {
          const result = await executeFunction(data);
          requestResponse.successfulImport.push(result);
        } catch (err) {
          requestResponse.failureImport.push({
            line: index + 2,
            message: err.toString(),
          });
        }
      } else {
        requestResponse.failureImport.push({
          line: index + 2,
          message: 'Columns missing : ' + missingColumns.toString(),
        });
      }
    }
    requestResponse.total.success = requestResponse.successfulImport.length;
    requestResponse.total.failure = requestResponse.failureImport.length;
    return res.ok(requestResponse);
  },
};
