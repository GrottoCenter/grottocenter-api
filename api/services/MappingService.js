/* eslint-disable no-underscore-dangle */
/**
 * Mapper for API models
 *
 * BE CAREFULL Any change here must be reported to the file swaggerV1.yaml!
 */

const ramda = require('ramda');

/* Load Models */
const CaveModel = require('./mappingModels/CaveModel');
const CaverModel = require('./mappingModels/CaverModel');
const CountResultModel = require('./mappingModels/CountResultModel');
const DescriptionModel = require('./mappingModels/DescriptionModel');
const DocumentDuplicateModel = require('./mappingModels/DocumentDuplicateModel');
const DocumentModel = require('./mappingModels/DocumentModel');
const EntranceDuplicateModel = require('./mappingModels/EntranceDuplicateModel');
const EntranceModel = require('./mappingModels/EntranceModel');
const LanguageModel = require('./mappingModels/LanguageModel');
const LocationModel = require('./mappingModels/LocationModel');
const MassifModel = require('./mappingModels/MassifModel');
const NameModel = require('./mappingModels/NameModel');
const OrganizationModel = require('./mappingModels/OrganizationModel');
const SubjectModel = require('./mappingModels/SubjectModel');

const FileService = require('./FileService');

module.exports = {
  getMainName: (source) => {
    let mainName = ramda.pathOr(null, ['name'], source); // from ES, name is the mainName
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
        : undefined;
    result.entrance =
      source.entrance instanceof Object
        ? module.exports.convertToEntranceModel(source.entrance)
        : undefined;
    result.language =
      source.language instanceof Object
        ? module.exports.convertToLanguageModel(source.language)
        : undefined;
    result.reviewer =
      source.reviewer instanceof Object
        ? module.exports.convertToCaverModel(source.reviewer)
        : undefined;

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
    result.language = source.language;
    result.point = source.point;
    result.relevance = source.relevance;
    result.title = source.title;

    result.author = module.exports.convertToCaverModel(source.author);
    result.cave =
      source.cave instanceof Object
        ? module.exports.convertToCaveModel(source.cave)
        : undefined;
    result.document =
      source.document instanceof Object
        ? module.exports.convertToDocumentModel(source.document)
        : undefined;
    result.entrance =
      source.entrance instanceof Object
        ? module.exports.convertToEntranceModel(source.entrance)
        : undefined;
    result.exit =
      source.exit instanceof Object
        ? module.exports.convertToEntranceModel(source.exit)
        : undefined;
    result.massif =
      source.massif instanceof Object
        ? module.exports.convertToMassifModel(source.massif)
        : undefined;
    result.reviewer =
      source.reviewer instanceof Object
        ? module.exports.convertToCaverModel(source.reviewer)
        : undefined;

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

    result.author = module.exports.convertToCaverModel(source.author);
    result.cave =
      source.cave instanceof Object
        ? module.exports.convertToCaveModel(source.cave)
        : undefined;
    result.entrance =
      source.entrance instanceof Object
        ? module.exports.convertToEntranceModel(source.entrance)
        : undefined;
    result.massif =
      source.massif instanceof Object
        ? module.exports.convertToMassifModel(source.massif)
        : undefined;
    result.organization =
      source.grotto instanceof Object
        ? module.exports.convertToOrganizationModel(source.grotto)
        : undefined;
    result.reviewer =
      source.reviewer instanceof Object
        ? module.exports.convertToCaverModel(source.reviewer)
        : undefined;

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
    result.comments = source.comments;
    result.country = source.country;
    result.countryCode = source['country code'];
    result.county = source.county;
    result.city = source.city;
    result.dateInscription = source.dateInscription;
    result.dateReviewed = source.dateReviewed;
    result.discoveryYear = source.yearDiscovery;
    result.externalUrl = source.externalUrl;
    result.histories = source.histories;
    result.id = source.id;
    result.isDeleted = source.isDeleted;
    result.isSensitive = source.isSensitive;
    result.latitude = parseFloat(source.latitude);
    result.locations = source.locations;
    result.longitude = parseFloat(source.longitude);
    result.name = module.exports.getMainName(source);
    result.names = source.names;
    result.postalCode = source.postalCode;
    result.precision = source.precision;
    result.region = source.region;
    result.riggings = source.riggings;
    result.stats = source.stats;
    result.timeInfo = source.timeInfo;

    // Cave (DB or ES)
    if (source.cave instanceof Object) {
      result.cave = module.exports.convertToCaveModel(source.cave);
    } else if (source['cave name']) {
      result.cave = {
        depth: source['cave depth'],
        length: source['cave length'],
        name: source['cave name'],
        isDiving: source['cave is diving'],
      };
    }
    // Once cave is populated, put the massif at the root of the entrance
    // (more convenient for the client)
    result.massif = ramda.pathOr(undefined, ['cave', 'massif'], result);

    // Author
    if (source.author instanceof Object) {
      result.author = module.exports.convertToCaverModel(source.author);
    }

    // Descriptions
    if (source.descriptions instanceof Array) {
      result.descriptions = module.exports.convertToDescriptionList(
        source.descriptions
      ).descriptions;
    } else {
      result.descriptions = source.descriptions;
    }

    // Documents
    if (source.documents instanceof Array) {
      result.documents = module.exports.convertToDocumentList(
        source.documents
      ).documents;
    } else {
      result.documents = source.documents;
    }

    // Massif from ESearch
    if (source['massif name']) {
      result.massif = {
        name: source['massif name'],
      };
    }

    return result;
  },

  convertToDescriptionList: (source) => {
    const descriptions = [];
    source.forEach((item) =>
      descriptions.push(module.exports.convertToDescriptionModel(item))
    );
    return { descriptions };
  },

  convertToEntranceList: (source) => {
    const entrances = [];
    source.forEach((item) =>
      entrances.push(module.exports.convertToEntranceModel(item))
    );
    return entrances;
  },

  convertToCountResultModel: (source) => {
    const result = {
      ...CountResultModel,
    };
    result.count = source.count;
    return result;
  },

  convertToCaverList: (source) => {
    const cavers = [];
    source.forEach((item) =>
      cavers.push(module.exports.convertToCaverModel(item))
    );
    return {
      cavers,
    };
  },

  convertToCaverModel: (source) => {
    const result = {
      ...CaverModel,
    };
    result.id = source.id;
    result['@id'] = String(source.id);
    result.language = source.language;
    result.mail = source.mail;
    result.nickname = source.nickname;
    result.name = source.name;
    result.surname = source.surname;

    if (source.documents) {
      if (source.documents instanceof Array) {
        result.documents = source.documents;
      } else {
        result.documents = source.documents.split(',').map((documentId) => ({
          id: parseInt(documentId, 10),
        }));
      }
    }

    if (source.exploredEntrances) {
      if (source.exploredEntrances instanceof Array) {
        result.exploredEntrances = source.exploredEntrances;
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
        result.organizations = source.grottos;
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
    result.histories = source.histories;
    result.isDeleted = source.is_deleted;
    result.isDiving = source.is_diving;
    result.latitude = parseFloat(source.latitude);
    result.length = source.length;
    result.longitude = parseFloat(source.longitude);
    result.name = module.exports.getMainName(source);
    result.names = source.names;
    result.temperature = source.temperature;

    if (source.id_author instanceof Object) {
      result.author = module.exports.convertToCaverModel(source.id_author);
    } else {
      result.author = source.id_author;
    }
    if (source.reviewer instanceof Object) {
      result.reviewer = module.exports.convertToCaverModel(source.id_reviewer);
    } else {
      result.reviewer = source.id_reviewer;
    }
    if (source.descriptions instanceof Array) {
      result.descriptions = module.exports.convertToDescriptionList(
        source.descriptions
      ).descriptions;
    }
    if (source.entrances instanceof Array) {
      result.entrances = module.exports.convertToEntranceList(source.entrances);
    }
    if (source.documents instanceof Array) {
      result.documents = module.exports.convertToDocumentList(
        source.documents
      ).documents;
    }
    if (source.id_massif instanceof Object) {
      result.massif = module.exports.convertToMassifModel(source.id_massif);
    } else {
      result.massif = source.id_massif;
    }
    return result;
  },

  convertToCaveList: (source) => {
    const caves = [];
    source.forEach((item) =>
      caves.push(module.exports.convertToCaveModel(item))
    );
    return caves;
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
    result.author = source.author;
    result.dateInscription = source.dateInscription;
    result.dateReviewed = source.dateReviewed;
    result.geogPolygon = source.geoJson;
    result.name = module.exports.getMainName(source);
    result.names = source.names;
    result.reviewer = source.reviewer;

    if (source.author) {
      result.author = module.exports.convertToCaverModel(source.author);
    }

    // Entrances from caves (from DB)
    if (source.caves) {
      let entrances = [];
      for (const cave of source.caves) {
        entrances = entrances.concat(
          module.exports.convertToEntranceList(cave.entrances)
        );
      }
      result.entrances = entrances;
    }

    if (source.descriptions instanceof Array) {
      result.descriptions = module.exports.convertToDescriptionList(
        source.descriptions
      ).descriptions;
    } else {
      result.descriptions = source.descriptions;
    }

    if (source.documents instanceof Array) {
      result.documents = module.exports.convertToDocumentList(
        source.documents
      ).documents;
    } else {
      result.documents = source.documents;
    }

    // Networks (from DB)
    if (source.networks) {
      result.networks = module.exports.convertToCaveList(source.networks);
    }

    // Nb caves & entrances (from ES)
    result.nbCaves = ramda.pathOr(undefined, ['nb caves'], source);
    result.nbEntrances = ramda.pathOr(undefined, ['nb entrances'], source);

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
    result.mail = source.mail;
    result.pictureFileName = source.pictureFileName;
    result.postalCode = source.postalCode;
    result.region = source.region;
    result.url = source.url;
    result.village = source.village;
    result.yearBirth = source.yearBirth;

    // Convert cavers
    if (source.cavers instanceof Array) {
      result.cavers = source.cavers.map((caver) =>
        module.exports.convertToCaverModel(caver)
      );
    } else {
      result.nbCavers = ramda.pathOr(undefined, ['nb cavers'], source);
    }

    // Convert explored / partner entrances and networks
    if (source.exploredEntrances instanceof Array) {
      result.exploredEntrances = module.exports.convertToEntranceList(
        source.exploredEntrances
      );
    }
    if (source.exploredNetworks instanceof Array) {
      result.exploredNetworks = module.exports.convertToCaveList(
        source.exploredNetworks
      );
    }
    if (source.documents instanceof Array) {
      result.documents = module.exports.convertToDocumentList(
        source.documents
      ).documents;
    }
    if (source.partnerEntrances instanceof Array) {
      result.partnerEntrances = module.exports.convertToEntranceList(
        source.partnerEntrances
      );
    }
    if (source.partnerNetworks instanceof Array) {
      result.partnerNetworks = module.exports.convertToCaveList(
        source.partnerNetworks
      );
    }

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

  convertToFileList: (source) => {
    const files = [];
    source.forEach((item) =>
      files.push(module.exports.convertToFileModel(item))
    );
    return {
      files,
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
    result.authorizationDocument = source.authorizationDocument
      ? module.exports.convertToDocumentModel(source.authorizationDocument)
      : null;
    result.cave = source.cave;
    result.dateInscription = source.dateInscription;
    result.datePublication = source.date_publication
      ? source.date_publication
      : source.datePublication;
    result.dateReviewed = source.dateReviewed;
    result.dateValidation = source.dateValidation;
    result.deletedFiles = source.deletedFiles;
    result.entrance = source.entrance;
    result.files =
      source.files && module.exports.convertToFileList(source.files).files;
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
    result.parent = source.parent
      ? module.exports.convertToDocumentModel(source.parent)
      : null;
    result.publicationFasciculeBBSOld = source.publicationFasciculeBBSOld;
    result.refBbs = source.ref_bbs ? source.ref_bbs : source.refBbs;
    result.reviewer = source.reviewer;
    result.title = source.title;
    result.validationComment = source.validationComment;
    result.validator = source.validator;

    result.author =
      source.author instanceof Object
        ? module.exports.convertToCaverModel(source.author)
        : undefined;

    // source.descriptions contains both title and descriptions (in .title and .body)
    // Split them in 2 different attributes
    if (source.descriptions) {
      result.descriptions = source.descriptions.map((d) => {
        const newDescription = {
          ...ramda.omit(['title', 'body'], d),
          text: d.body,
        };
        return newDescription;
      });
      result.titles = source.descriptions.map((d) => {
        const newDescription = {
          ...ramda.omit(['title', 'body'], d),
          text: d.title,
        };
        return newDescription;
      });
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

    // Convert authors
    if (source.authors instanceof Array) {
      result.authors = module.exports.convertToCaverList(source.authors).cavers;
    } else {
      result.authors = source.authors;
    }

    // Convert children document
    if (source.children instanceof Array) {
      result.children = module.exports.convertToDocumentList(
        source.children
      ).documents;
    } else {
      result.children = source.children;
    }

    // TODO: handle publication (old bbs & parent)
    result.publication = source.publication_other_bbs_old
      ? source.publication_other_bbs_old
      : source.publicationOtherBBSOld;

    // Convert regions
    if (source.regions) {
      if (source.regions instanceof Array) {
        result.regions = source.regions;
      } else {
        // ES
        result.regions = source.regions
          ? source.regions.split(', ').map((r) => ({
              name: r,
            }))
          : null;
      }
    }

    // Convert subjects
    if (source.subjects instanceof Array) {
      result.subjects = module.exports.convertToSubjectList(
        source.subjects
      ).subjects;
    } else {
      // ES
      result.subjects = source.subjects
        ? source.subjects.split(', ').map((s) => ({
            code: s,
          }))
        : null;
    }

    // Convert library
    if (source['library id']) {
      // ES
      result.library = {
        id: source['library id'],
        name: source['library name'],
      };
    } else {
      result.library = source.library;
    }

    // Convert editor
    if (source['editor id']) {
      // ES
      result.editor = {
        id: source['editor id'],
        name: source['editor name'],
      };
    } else {
      result.editor = source.editor;
    }

    // Convert type
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

    return result;
  },

  convertToDocumentList: (source) => {
    const documents = [];
    source.forEach((item) =>
      documents.push(module.exports.convertToDocumentModel(item))
    );
    return {
      documents,
    };
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

  convertToSubjectList: (source) => {
    const subjects = [];
    source.forEach((item) =>
      subjects.push(module.exports.convertToSubjectModel(item))
    );
    return {
      subjects,
    };
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
        : undefined;

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

  // eslint-disable-next-line max-len
  convertToDocumentDuplicateList: (source) =>
    source.map((duplicate) =>
      module.exports.convertToDocumentDuplicateModel(duplicate)
    ),

  convertToEntranceDuplicateModel: (source) => {
    const result = {
      ...EntranceDuplicateModel,
    };

    result.id = source.id;
    result.author =
      source.author instanceof Object
        ? module.exports.convertToCaverModel(source.author)
        : undefined;
    result.content = source.content;
    result.datePublication = source.datePublication;
    result.entrance =
      source.entrance instanceof Object
        ? module.exports.convertToEntranceModel(source.entrance)
        : source.entrance;

    return result;
  },

  // eslint-disable-next-line max-len
  convertToEntranceDuplicateList: (source) =>
    source.map((duplicate) =>
      module.exports.convertToEntranceDuplicateModel(duplicate)
    ),

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

    if (source.documents instanceof Array) {
      result.documents = module.exports.convertToDocumentList(
        source.documents
      ).documents;
    } else {
      result.documents = source.documents;
    }

    return result;
  },
};
