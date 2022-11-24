/* eslint-disable no-underscore-dangle */
/**
 * Mapper for API models
 *
 * BE CAREFULL Any change here must be reported to the file swaggerV1.yaml!
 */

const ramda = require('ramda');

const CaveModel = require('./models/CaveModel');
const CaverModel = require('./models/CaverModel');
const CommentModel = require('./models/CommentModel');
const CountResultModel = require('./models/CountResultModel');
const DescriptionModel = require('./models/DescriptionModel');
const DocumentDuplicateModel = require('./models/DocumentDuplicateModel');
const DocumentModel = require('./models/DocumentModel');
const EntranceDuplicateModel = require('./models/EntranceDuplicateModel');
const EntranceModel = require('./models/EntranceModel');
const HistoryModel = require('./models/HistoryModel');
const LanguageModel = require('./models/LanguageModel');
const LocationModel = require('./models/LocationModel');
const MassifModel = require('./models/MassifModel');
const NameModel = require('./models/NameModel');
const NotificationModel = require('./models/NotificationModel');
const OrganizationModel = require('./models/OrganizationModel');
const RiggingModel = require('./models/RiggingModel');
const SubjectModel = require('./models/SubjectModel');
const { convertToList } = require('./utils');

const FileService = require('../FileService');
const { postgreIntervalObjectToDbString } = require('../CommentService');
const RiggingService = require('../RiggingService');

module.exports = {
  getMainName: (source) => {
    let mainName = ramda.pathOr(null, ['name'], source); // from Elasticsearch, name is the mainName
    if (mainName === null && source.names instanceof Array) {
      mainName = source.names.find((name) => name.isMain);
      mainName = mainName === undefined ? null : mainName.name;
    }
    return mainName;
  },

  convertToLocationModel: (source) => {
    const result = {
      ...LocationModel,
    };

    result.body = source.body;
    result.dateInscription = source.dateInscription;
    result.dateReviewed = source.dateReviewed;
    result.id = source.id;
    result.relevance = source.relevance;
    result.title = source.title;

    result.author =
      source.author instanceof Object
        ? module.exports.convertToCaverModel(source.author)
        : source.author;
    result.entrance =
      source.entrance instanceof Object
        ? module.exports.convertToEntranceModel(source.entrance)
        : source.entrance;
    result.language =
      source.language instanceof Object
        ? module.exports.convertToLanguageModel(source.language)
        : source.language;
    result.reviewer =
      source.reviewer instanceof Object
        ? module.exports.convertToCaverModel(source.reviewer)
        : source.reviewer;

    return result;
  },

  convertToDescriptionModel: (source) => {
    const result = {
      ...DescriptionModel,
    };

    result.body = source.body;
    result.dateInscription = source.dateInscription;
    result.dateReviewed = source.dateReviewed;
    result.id = source.id;
    result.point = source.point;
    result.relevance = source.relevance;
    result.title = source.title;

    // Convert objects
    result.author =
      source.author instanceof Object
        ? module.exports.convertToCaverModel(source.author)
        : source.author;
    result.cave =
      source.cave instanceof Object
        ? module.exports.convertToCaveModel(source.cave)
        : source.cave;
    result.document =
      source.document instanceof Object
        ? module.exports.convertToDocumentModel(source.document)
        : source.document;
    result.entrance =
      source.entrance instanceof Object
        ? module.exports.convertToEntranceModel(source.entrance)
        : source.entrance;
    result.exit =
      source.exit instanceof Object
        ? module.exports.convertToEntranceModel(source.exit)
        : source.exist;
    result.massif =
      source.massif instanceof Object
        ? module.exports.convertToMassifModel(source.massif)
        : source.massif;
    result.reviewer =
      source.reviewer instanceof Object
        ? module.exports.convertToCaverModel(source.reviewer)
        : source.reviewer;
    result.language =
      source.language instanceof Object
        ? module.exports.convertToLanguageModel(source.language)
        : source.language;

    return result;
  },

  convertToHistoryModel: (source) => {
    const result = {
      ...HistoryModel,
    };

    result.body = source.body;
    result.dateInscription = source.dateInscription;
    result.dateReviewed = source.dateReviewed;
    result.id = source.id;
    result.point = source.point;
    result.relevance = source.relevance;

    result.author = module.exports.convertToCaverModel(source.author);
    result.cave =
      source.cave instanceof Object
        ? module.exports.convertToCaveModel(source.cave)
        : source.cave;
    result.entrance =
      source.entrance instanceof Object
        ? module.exports.convertToEntranceModel(source.entrance)
        : source.entrance;
    result.reviewer =
      source.reviewer instanceof Object
        ? module.exports.convertToCaverModel(source.reviewer)
        : source.reviewer;
    result.language =
      source.language instanceof Object
        ? module.exports.convertToLanguageModel(source.language)
        : source.language;
    return result;
  },

  convertToCommentModel: (source) => {
    const result = {
      ...CommentModel,
    };

    result.aestheticism = source.aestheticism;
    result.approach = source.approach;
    result.body = source.body;
    result.caving = source.caving;
    result.dateInscription = source.dateInscription;
    result.dateReviewed = source.dateReviewed;
    result.eTTrail = postgreIntervalObjectToDbString(source.eTTrail);
    result.eTUnderground = postgreIntervalObjectToDbString(
      source.eTUnderground
    );
    result.id = source.id;
    result.isDeleted = source.isDeleted;
    result.point = source.point;
    result.relevance = source.relevance;
    result.title = source.title;

    // Convert objects
    result.author =
      source.author instanceof Object
        ? module.exports.convertToCaverModel(source.author)
        : source.author;
    result.cave =
      source.cave instanceof Object
        ? module.exports.convertToCaveModel(source.cave)
        : source.cave;
    result.entrance =
      source.entrance instanceof Object
        ? module.exports.convertToEntranceModel(source.entrance)
        : source.entrance;
    result.language =
      source.language instanceof Object
        ? module.exports.convertToLanguageModel(source.language)
        : source.language;
    result.reviewer =
      source.reviewer instanceof Object
        ? module.exports.convertToCaverModel(source.reviewer)
        : source.reviewer;

    return result;
  },

  convertToRiggingModel: (source) => {
    const result = {
      ...RiggingModel,
    };
    result.anchors = source.anchors;
    result.dateInscription = source.dateInscription;
    result.dateReviewed = source.dateReviewed;
    result.id = source.id;
    result.isDeleted = source.isDeleted;
    result.observations = source.observations;
    result.obstacles = source.obstacles;
    result.point = source.point;
    result.relevance = source.relevance;
    result.ropes = source.ropes;
    result.title = source.title;
    RiggingService.formatRiggingForAPI(result);

    // Convert objects
    result.author =
      source.author instanceof Object
        ? module.exports.convertToCaverModel(source.author)
        : source.author;
    result.cave =
      source.cave instanceof Object
        ? module.exports.convertToCaveModel(source.cave)
        : source.cave;
    result.entrance =
      source.entrance instanceof Object
        ? module.exports.convertToEntranceModel(source.entrance)
        : source.entrance;
    result.language =
      source.language instanceof Object
        ? module.exports.convertToLanguageModel(source.language)
        : source.language;
    result.reviewer =
      source.reviewer instanceof Object
        ? module.exports.convertToCaverModel(source.reviewer)
        : source.reviewer;

    return result;
  },

  convertToNameModel: (source) => {
    const result = {
      ...NameModel,
    };

    result.dateInscription = source.dateInscription;
    result.dateReviewed = source.dateReviewed;
    result.id = source.id;
    result.isMain = source.isMain;
    result.language = source.language;
    result.name = source.name;
    result.point = source.point;

    result.author =
      source.author instanceof Object
        ? module.exports.convertToCaverModel(source.author)
        : source.author;
    result.cave =
      source.cave instanceof Object
        ? module.exports.convertToCaveModel(source.cave)
        : source.cave;
    result.entrance =
      source.entrance instanceof Object
        ? module.exports.convertToEntranceModel(source.entrance)
        : source.entrance;
    result.massif =
      source.massif instanceof Object
        ? module.exports.convertToMassifModel(source.massif)
        : source.massif;
    result.organization =
      source.grotto instanceof Object
        ? module.exports.convertToOrganizationModel(source.grotto)
        : source.grotto;
    result.reviewer =
      source.reviewer instanceof Object
        ? module.exports.convertToCaverModel(source.reviewer)
        : source.reviewer;

    return result;
  },

  convertToEntranceModel: (source) => {
    const result = {
      ...EntranceModel,
    };

    result['@id'] = String(source.id);
    result.address = source.address;
    result.aestheticism = source.aestheticism;
    result.altitude = source.altitude;
    result.approach = source.approach;
    result.caving = source.caving;
    result.country = source.country;
    result.countryCode = source['country code'];
    result.county = source.county;
    result.city = source.city;
    result.dateInscription = source.dateInscription;
    result.dateReviewed = source.dateReviewed;
    result.discoveryYear = source.yearDiscovery;
    result.externalUrl = source.externalUrl;
    result.id = source.id;
    result.isDeleted = source.isDeleted;
    result.isSensitive = source.isSensitive;
    result.latitude = parseFloat(source.latitude);
    result.longitude = parseFloat(source.longitude);
    result.name = module.exports.getMainName(source);
    result.names = source.names;
    result.postalCode = source.postalCode;
    result.precision = source.precision;
    result.region = source.region;
    result.stats = source.stats;
    result.timeInfo = source.timeInfo;

    // Cave
    if (source['cave name']) {
      // from Elasticsearch
      result.cave = {
        depth: source['cave depth'],
        length: source['cave length'],
        name: source['cave name'],
        isDiving: source['cave is diving'],
      };
    } else if (source.cave instanceof Object) {
      result.cave = module.exports.convertToCaveModel(source.cave);
    } else {
      result.cave = source.cave;
    }
    // Once cave is populated, put the massifs at the root of the entrance
    // (more convenient for the client)
    result.massifs = ramda.pathOr(undefined, ['cave', 'massifs'], result);

    // Author
    if (source.author instanceof Object) {
      result.author = module.exports.convertToCaverModel(source.author);
    }

    // Convert collections
    const {
      convertToCommentModel,
      convertToDescriptionModel,
      convertToDocumentModel,
      convertToHistoryModel,
      convertToLocationModel,
      convertToRiggingModel,
    } = module.exports;

    result.descriptions = convertToList(
      'descriptions',
      source,
      convertToDescriptionModel
    );
    result.comments = convertToList('comments', source, convertToCommentModel);
    result.documents = convertToList(
      'documents',
      source,
      convertToDocumentModel
    );
    result.histories = convertToList(
      'histories',
      source,
      convertToHistoryModel
    );
    result.locations = convertToList(
      'locations',
      source,
      convertToLocationModel
    );
    result.riggings = convertToList('riggings', source, convertToRiggingModel);

    // Massif from Elasticsearch
    if (source['massif name']) {
      result.massifs = {
        name: source['massif name'],
      };
    }

    return result;
  },

  convertToCountResultModel: (source) => {
    const result = {
      ...CountResultModel,
    };
    result.count = source.count;
    return result;
  },

  convertToCaverModel: (source) => {
    const result = {
      ...CaverModel,
    };
    result.id = source.id;
    result['@id'] = String(source.id);
    result.language = source.language;
    result.nickname = source.nickname;
    result.name = source.name;
    result.surname = source.surname;

    // Convert collections
    const {
      convertToEntranceModel,
      convertToDocumentModel,
      convertToOrganizationModel,
    } = module.exports;

    if (source.documents) {
      if (source.documents instanceof Array) {
        result.documents = convertToList(
          'documents',
          source,
          convertToDocumentModel
        );
      } else {
        result.documents = source.documents.split(',').map((documentId) => ({
          id: parseInt(documentId, 10),
        }));
      }
    }

    if (source.exploredEntrances) {
      if (source.exploredEntrances instanceof Array) {
        result.exploredEntrances = convertToList(
          'exploredEntrances',
          source,
          convertToEntranceModel
        );
      } else {
        result.exploredEntrances = source.exploredEntrances
          .split(',')
          .map((entranceId) => ({
            id: parseInt(entranceId, 10),
          }));
      }
    }

    if (source.groups) {
      if (source.groups instanceof Array) {
        result.groups = source.groups;
      } else {
        result.groups = source.groups.split(',').map((groupId) => ({
          id: parseInt(groupId, 10),
        }));
      }
    }

    if (source.grottos) {
      if (source.grottos instanceof Array) {
        result.organizations = convertToList(
          'organizations',
          source,
          convertToOrganizationModel
        );
      } else {
        result.organizations = source.grottos.split(',').map((grottoId) => ({
          id: parseInt(grottoId, 10),
        }));
      }
    }

    return result;
  },

  convertToCaveModel: (source) => {
    const result = {
      ...CaveModel,
    };
    result.id = source.id;
    result['@id'] = String(source.id);

    result.dateInscription = source.date_inscription;
    result.dateReviewed = source.date_reviewed;
    result.depth = source.depth;
    result.isDeleted = source.is_deleted;
    result.isDiving = source.is_diving;
    result.latitude = parseFloat(source.latitude);
    result.length = source.length;
    result.longitude = parseFloat(source.longitude);
    result.name = module.exports.getMainName(source);
    result.names = source.names;
    result.temperature = source.temperature;

    // Convert objects
    result.author =
      source.id_author instanceof Object
        ? module.exports.convertToCaverModel(source.id_author)
        : source.id_author;

    result.reviewer =
      source.id_reviewer instanceof Object
        ? module.exports.convertToCaverModel(source.id_reviewer)
        : source.id_reviewer;

    // Convert collections
    const {
      convertToEntranceModel,
      convertToDescriptionModel,
      convertToDocumentModel,
      convertToHistoryModel,
      convertToMassifModel,
    } = module.exports;

    result.descriptions = convertToList(
      'descriptions',
      source,
      convertToDescriptionModel
    );
    result.entrances = convertToList(
      'entrances',
      source,
      convertToEntranceModel
    );
    result.documents = convertToList(
      'documents',
      source,
      convertToDocumentModel
    );
    result.histories = convertToList(
      'histories',
      source,
      convertToHistoryModel
    );
    result.massifs = convertToList('massifs', source, convertToMassifModel);

    return result;
  },

  /**
   * Function that return all data for the search
   * @param {*} source : the elasticsearch result
   */
  convertToCompleteSearchResult: (source) => {
    const res = {};
    const values = [];

    // For each result of the research, convert the item and add it to the json to send
    source.hits.hits.forEach((item) => {
      let data = '';
      // Convert the data according to its first tag
      switch (item._source.tags[0]) {
        case 'cave':
          data = module.exports.convertToCaveModel(item._source);
          break;
        case 'caver':
          data = module.exports.convertToCaverModel(item._source);
          break;
        case 'document':
          data = module.exports.convertToDocumentModel(item._source);
          break;
        case 'entrance':
          data = module.exports.convertToEntranceModel(item._source);
          break;
        case 'grotto':
          data = module.exports.convertToOrganizationModel(item._source);
          break;
        case 'language':
          data = module.exports.convertToLanguageModel(item._source);
          break;
        case 'massif':
          data = module.exports.convertToMassifModel(item._source);
          break;
        case 'network':
          data = module.exports.convertToCaveModel(item._source);
          break;
        default:
      }
      // Add the type and hightlight of the data
      data.type = item._source.tags[0];
      data.highlights = item.highlight;

      values.push(data);
    });
    res.results = values;
    res.totalNbResults = source.hits.total.value;
    return res;
  },

  /**
   * Function that return only the main information about a result.
   * @param {*} source : the elasticsearch result
   */
  convertEsToSearchResult: (source) => {
    const res = {};
    const values = [];

    if (source.hits) {
      source.hits.hits.forEach((item) => {
        // Common data
        const data = {
          id: item._id,
          name: item._source.name ? item._source.name : item._source.title, // Handle title for documents (instead of name)
          type: item._source.tags[0],
          highlights: item.highlight,
        };

        if (item._source.longitude) {
          data.longitude = parseFloat(item._source.longitude);
        }
        if (item._source.latitude) {
          data.latitude = parseFloat(item._source.latitude);
        }

        // 08/2020 - C. ROIG - Not needed at the moment but keep in case
        // const replacementKeys = {};

        // // Convert from a collection of keys newKeys, rename the keys of obj
        // const renameKeys = (obj, newKeys) => {
        //   Object.keys(obj).map((key) => {
        //     if (newKeys[key]) {
        //       obj[newKeys[key]] = obj[key];
        //       delete obj[key];
        //     }
        //   });
        // };

        switch (item._source.tags[0]) {
          case 'entrance':
            data.cave = {
              id: item._source.id_cave,
              name: item._source['cave name'],
              depth: item._source['cave depth'],
              length: item._source['cave length'],
            };
            data.city = item._source.city;
            data.region = item._source.region;
            data.names = item._source.names;
            data.descriptions = item._source.descriptions;
            break;

          case 'grotto':
            data.names = item._source.names;
            data.address = item._source.address;
            break;

          case 'massif':
            data.names = item._source.names;
            data.descriptions = item._source.descriptions;
            break;

          case 'document':
          case 'document-collection':
          case 'document-issue':
            // Rename keys of source and highlights
            // 08/2020 - C. ROIG - Not needed at the moment but keep in case
            // renameKeys(item['_source'], replacementKeys);
            // renameKeys(data.highlights, replacementKeys);

            // Fill data with appropriate keys
            Object.keys(item._source).forEach((key) => {
              data[key] = item._source[key];
            });

            // Construct document type
            data.documentType = {
              id: ramda.pathOr(null, ['_source', 'type id'], item),
              name: ramda.pathOr(null, ['_source', 'type name'], item),
            };
            delete data['type id'];
            delete data['type name'];

            // Construct editor
            data.editor =
              ramda.pathOr(null, ['_source', 'editor id'], item) === null
                ? null
                : {
                    id: ramda.pathOr(null, ['_source', 'editor id'], item),
                    name: ramda.pathOr(null, ['_source', 'editor name'], item),
                  };

            // Construct library
            data.library =
              ramda.pathOr(null, ['_source', 'library id'], item) === null
                ? null
                : {
                    id: ramda.pathOr(null, ['_source', 'library id'], item),
                    name: ramda.pathOr(null, ['_source', 'library name'], item),
                  };
            delete data['library id'];
            delete data['library name'];
            break;

          case 'caver':
            data.surname = item._source.surname;
            data.nickname = item._source.nickname;
            // Don't return mail (RGPD)
            // data.mail = item['_source'].mail;
            break;

          case 'language':
            data.refName = item._source.ref_name;
            data.isPrefered = item._source.is_prefered;
            data.part1 = item._source.part1;
            data.part2b = item._source.part2b;
            data.part2t = item._source.part2t;
            data.scope = item._source.scope;
            break;

          case 'cave':
          case 'network':
            data.depth = item._source.depth;
            data.descriptions = item._source.descriptions;
            data.isDiving = item._source.is_diving;
            data.length = item._source.length;
            data.names = item._source.names;
            data.sizeCoef = item._source.size_coef;
            data.temperature = item._source.temperature;
            break;
          default:
        }
        values.push(data);
      });
    }

    res.results = values;
    res.totalNbResults = source.hits.total.value;
    return res;
  },

  // ---------------- Massif Mapping ------------------------------

  convertToMassifModel: (source) => {
    const result = {
      ...MassifModel,
    };

    result.id = source.id;
    result['@id'] = String(source.id);
    result.dateInscription = source.dateInscription;
    result.dateReviewed = source.dateReviewed;
    result.geogPolygon = source.geoJson;
    result.name = module.exports.getMainName(source);
    result.names = source.names;
    result.nbCaves = source['nb caves']; // from Elasticsearch
    result.nbEntrances = source['nb entrances']; // from Elasticsearch

    // Convert object
    if (source.author) {
      result.author =
        source.author instanceof Object
          ? module.exports.convertToCaverModel(source.author)
          : source.author;
    }
    if (source.reviewer) {
      result.reviewer =
        source.reviewer instanceof Object
          ? module.exports.convertToCaverModel(source.reviewer)
          : source.reviewer;
    }

    // Convert collections
    const {
      convertToCaveModel,
      convertToEntranceModel,
      convertToDocumentModel,
    } = module.exports;

    result.entrances = convertToList(
      'entrances',
      source,
      convertToEntranceModel
    );

    result.descriptions = convertToList(
      'entrances',
      source,
      convertToEntranceModel
    );

    result.documents = convertToList(
      'documents',
      source,
      convertToDocumentModel
    );

    result.networks = convertToList('networks', source, convertToCaveModel);

    return result;
  },

  // ---------------- Organization Mapping ---------------------------

  convertToOrganizationModel: (source) => {
    const result = {
      ...OrganizationModel,
    };

    result.id = source.id;
    result['@id'] = String(source.id);
    result.address = source.address;
    result.city = source.city;
    result.customMessage = source.customMessage;
    result.country = source.country;
    result.countryCode = source['country code'];
    result.county = source.county;
    result.dateInscription = source.dateInscription;
    result.isOfficialPartner = source.isOfficialPartner;
    result.latitude = parseFloat(source.latitude);
    result.longitude = parseFloat(source.longitude);
    result.name = module.exports.getMainName(source);
    result.names = source.names;
    result.nbCavers = source['nb cavers']; // from Elasticsearch
    result.mail = source.mail;
    result.pictureFileName = source.pictureFileName;
    result.postalCode = source.postalCode;
    result.region = source.region;
    result.url = source.url;
    result.village = source.village;
    result.yearBirth = source.yearBirth;

    // Convert collections
    const {
      convertToCaveModel,
      convertToEntranceModel,
      convertToDocumentModel,
      convertToCaverModel,
    } = module.exports;

    result.cavers = convertToList('cavers', source, convertToCaverModel);
    result.documents = convertToList(
      'documents',
      source,
      convertToDocumentModel
    );
    result.exploredEntrances = convertToList(
      'exploredEntrances',
      source,
      convertToEntranceModel
    );
    result.exploredNetworks = convertToList(
      'exploredNetworks',
      source,
      convertToCaveModel
    );
    result.partnerEntrances = convertToList(
      'partnerEntrances',
      source,
      convertToEntranceModel
    );
    result.partnerNetworks = convertToList(
      'partnerNetworks',
      source,
      convertToCaveModel
    );

    return result;
  },

  // ---------------- Document Mapping ---------------------------

  convertToFileModel: (source) => {
    const { container, linkAccount } = FileService.getAzureData();
    return {
      ...source,
      completePath: `${linkAccount}/${container}/${source.path}`,
    };
  },

  convertToDocumentModel: (source) => {
    const result = {
      ...DocumentModel,
    };

    // Conversion (from Elasticsearch or not)
    result.id = source.id;
    result['@id'] = String(source.id);
    result.authorComment = source.authorComment;
    result.cave = source.cave;
    result.dateInscription = source.dateInscription;
    result.datePublication = source.date_publication
      ? source.date_publication
      : source.datePublication;
    result.dateReviewed = source.dateReviewed;
    result.dateValidation = source.dateValidation;
    result.deletedFiles = source.deletedFiles;
    result.entrance = source.entrance;
    result.identifier = source.identifier;
    result.intactDescriptions = source.descriptions;
    result.issue = source.issue;
    result.isValidated = source.isValidated;
    result.languages = source.languages;
    result.license = source.license;
    result.mainLanguage = source.mainLanguage;
    result.massif = source.massif;
    result.modifiedDocJson = source.modifiedDocJson;
    result.modifiedFiles = source.modifiedFiles;
    result.newFiles = source.newFiles;
    result.option = source.option;
    result.pages = source.pages;
    // TODO: handle publication (old bbs & parent)
    result.publication = source.publication_other_bbs_old
      ? source.publication_other_bbs_old
      : source.publicationOtherBBSOld;
    result.publicationFasciculeBBSOld = source.publicationFasciculeBBSOld;
    result.refBbs = source.ref_bbs ? source.ref_bbs : source.refBbs;
    result.title = source.title;
    result.validationComment = source.validationComment;

    // Convert objects
    result.author =
      source.author instanceof Object
        ? module.exports.convertToCaverModel(source.author)
        : source.author;

    result.reviewer =
      source.reviewer instanceof Object
        ? module.exports.convertToCaverModel(source.reviewer)
        : source.reviewer;

    result.validator =
      source.validator instanceof Object
        ? module.exports.convertToCaverModel(source.validator)
        : source.validator;

    result.authorizationDocument =
      source.authorizationDocument instanceof Object
        ? module.exports.convertToDocumentModel(source.authorizationDocument)
        : source.authorizationDocument;

    result.parent =
      source.parent instanceof Object
        ? module.exports.convertToDocumentModel(source.parent)
        : source.parent;

    // source.descriptions contains both title and descriptions (in .title and .body)
    // Split them in 2 different attributes
    if (source.descriptions) {
      result.descriptions = source.descriptions.map((d) => ({
        ...ramda.omit(['title', 'body'], d),
        text: d.body,
      }));
      result.titles = source.descriptions.map((d) => ({
        ...ramda.omit(['title', 'body'], d),
        text: d.title,
      }));
    }

    // Convert identifier type
    if (source.identifierType instanceof Object) {
      result.identifierType = {
        ...source.identifierType,
        id: ramda.pipe(
          ramda.pathOr(undefined, ['identifierType', 'id']),
          (id) => (id ? id.trim() : id)
        )(source),
      };
    } else {
      result.identifierType = source.identifierType;
    }

    // Library
    if (source['library id']) {
      // Elasticsearch
      result.library = {
        id: source['library id'],
        name: source['library name'],
      };
    } else {
      result.library =
        source.library instanceof Object
          ? module.exports.convertToOrganizationModel(source.library)
          : source.library;
    }

    // Editor
    if (source['editor id']) {
      // Elasticsearch
      result.editor = {
        id: source['editor id'],
        name: source['editor name'],
      };
    } else {
      result.editor =
        source.editor instanceof Object
          ? module.exports.convertToOrganizationModel(source.editor)
          : source.editor;
    }

    // Type
    if (source['type id']) {
      // ES
      result.type = {
        id: source['type id'],
        name: source['type name'],
      };
    }
    // Build document type
    // source.type can be the id of the type only or the full type object
    if (source.type) {
      if (ramda.propOr(null, 'id', source.type)) {
        result.type = source.type;
      } else {
        result.type = {
          id: source.type,
        };
      }
    }

    // Convert collections
    const {
      convertToCaverModel,
      convertToDocumentModel,
      convertToFileModel,
      convertToSubjectModel,
    } = module.exports;

    result.authors = convertToList('authors', source, convertToCaverModel);
    result.children = convertToList('children', source, convertToDocumentModel);
    result.files = convertToList('files', source, convertToFileModel);

    if (source.subjects instanceof Array) {
      result.subjects = convertToList(
        'subjects',
        source,
        convertToSubjectModel
      );
    } else {
      // Elasticsearch
      result.subjects = source.subjects
        ? source.subjects.split(', ').map((s) => ({
            code: s,
          }))
        : null;
    }

    // Convert regions
    if (source.regions) {
      if (source.regions instanceof Array) {
        result.regions = source.regions;
      } else {
        // Elasticsearch
        result.regions = source.regions
          ? source.regions.split(', ').map((r) => ({
              name: r,
            }))
          : null;
      }
    }

    return result;
  },

  convertToSubjectModel: (source) => {
    const result = {
      ...SubjectModel,
    };
    result.code = source.id.trim(); // there are some spaces at the end of the id in the DB
    result.subject = source.subject;
    result.parent =
      source.parent && source.parent.id && source.parent.subject
        ? module.exports.convertToSubjectModel(source.parent)
        : null;
    return result;
  },

  // ---------------- Duplicate Mapping ---------------------------

  convertToDocumentDuplicateModel: (source) => {
    const result = {
      ...DocumentDuplicateModel,
    };

    result.id = source.id;
    result.author =
      source.author instanceof Object
        ? module.exports.convertToCaverModel(source.author)
        : source.author;

    // When comming from a duplicate list, the content can't be casted to a full document model.
    // Detect this "simple" content by checking the number of keys (2: document and description)
    if (Object.keys(source.content).length === 2) {
      result.content = source.content;
    } else {
      result.content = module.exports.convertToDocumentModel(source.content);
    }

    result.datePublication = source.datePublication;
    result.document =
      source.document instanceof Object
        ? module.exports.convertToDocumentModel(source.document)
        : source.document;

    return result;
  },

  convertToDocumentDuplicateList: (source) => {
    const duplicates = [];
    source.forEach((item) =>
      duplicates.push(module.exports.convertToDocumentDuplicateModel(item))
    );
    return {
      duplicates,
    };
  },

  convertToEntranceDuplicateModel: (source) => {
    const result = {
      ...EntranceDuplicateModel,
    };

    result.id = source.id;
    result.content = source.content;
    result.datePublication = source.datePublication;

    // Convert objects
    result.author =
      source.author instanceof Object
        ? module.exports.convertToCaverModel(source.author)
        : source.author;
    result.entrance =
      source.entrance instanceof Object
        ? module.exports.convertToEntranceModel(source.entrance)
        : source.entrance;

    return result;
  },

  convertToEntranceDuplicateList: (source) => {
    const duplicates = [];
    source.forEach((item) =>
      duplicates.push(module.exports.convertToEntranceDuplicateModel(item))
    );
    return {
      duplicates,
    };
  },

  convertToLanguageModel: (source) => {
    const result = {
      ...LanguageModel,
    };
    result.id = source.id;
    result.comment = source.comment;
    result.isPrefered = source.isPrefered;
    result.part2b = source.part2b;
    result.part2t = source.part2t;
    result.part1 = source.part1;
    result.refName = source.refName;
    result.scope = source.scope;
    result.type = source.type;

    // Convert collections
    const { convertToDocumentModel } = module.exports;

    result.documents = convertToList(
      'documents',
      source,
      convertToDocumentModel
    );

    return result;
  },

  convertToNotificationModel: (source) => {
    const result = {
      ...NotificationModel,
    };
    result.id = source.id;
    result.dateInscription = source.dateInscription;
    result.dateReadAt = source.dateReadAt;
    result.notificationType = source.notificationType;
    result.notified = source.notified;
    result.notifier = source.notifier;

    // Convert object
    result.cave =
      source.cave instanceof Object
        ? module.exports.convertToCaveModel(source.cave)
        : source.cave;
    result.comment =
      source.comment instanceof Object
        ? module.exports.convertToCommentModel(source.comment)
        : source.comment;
    result.description =
      source.description instanceof Object
        ? module.exports.convertToDescriptionModel(source.description)
        : source.description;
    result.document =
      source.document instanceof Object
        ? module.exports.convertToDocumentModel(source.document)
        : source.document;
    result.entrance =
      source.entrance instanceof Object
        ? module.exports.convertToEntranceModel(source.entrance)
        : source.entrance;
    result.history =
      source.history instanceof Object
        ? module.exports.convertToHistoryModel(source.history)
        : source.history;
    result.location =
      source.location instanceof Object
        ? module.exports.convertToLocationModel(source.location)
        : source.location;
    result.massif =
      source.massif instanceof Object
        ? module.exports.convertToMassifModel(source.massif)
        : source.massif;
    result.notified =
      source.notified instanceof Object
        ? module.exports.convertToCaverModel(source.notified)
        : source.notified;
    result.notifier =
      source.notifier instanceof Object
        ? module.exports.convertToCaverModel(source.notifier)
        : source.notifier;
    result.organization =
      source.grotto instanceof Object
        ? module.exports.convertToOrganizationModel(source.grotto)
        : source.grotto;
    result.rigging =
      source.rigging instanceof Object
        ? module.exports.convertToRiggingModel(source.rigging)
        : source.rigging;

    return result;
  },
};
