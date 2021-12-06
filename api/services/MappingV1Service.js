/* eslint-disable dot-notation */
/**
 * Mapper for API V1 models
 *
 * BE CAREFULL Any change here must be reported on file apiV1.yaml!
 */

const ramda = require('ramda');

/* Load Models */
const CaveModel = require('./mappingModels/CaveModel');
const CaverModel = require('./mappingModels/CaverModel');
const CountResultModel = require('./mappingModels/CountResultModel');
const DescriptionModel = require('./mappingModels/DescriptionModel');
const DocumentModel = require('./mappingModels/DocumentModel');
const EntranceModel = require('./mappingModels/EntranceModel');
const LocationModel = require('./mappingModels/LocationModel');
const MassifModel = require('./mappingModels/MassifModel');
const NameModel = require('./mappingModels/NameModel');
const OrganizationModel = require('./mappingModels/OrganizationModel');
const SubjectModel = require('./mappingModels/SubjectModel');

/* Mappers */

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
    result.language = source.language;
    result.relevance = source.relevance;
    result.title = source.title;

    result.author =
      source.author instanceof Object
        ? MappingV1Service.convertToCaverModel(source.author)
        : undefined;
    result.entrance =
      source.entrance instanceof Object
        ? MappingV1Service.convertToEntranceModel(source.entrance)
        : undefined;
    result.reviewer =
      source.reviewer instanceof Object
        ? MappingV1Service.convertToCaverModel(source.reviewer)
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

    result.author = MappingV1Service.convertToCaverModel(source.author);
    result.cave =
      source.cave instanceof Object
        ? MappingV1Service.convertToCaveModel(source.cave)
        : undefined;
    result.document =
      source.document instanceof Object
        ? MappingV1Service.convertToDocumentModel(source.document)
        : undefined;
    result.entrance =
      source.entrance instanceof Object
        ? MappingV1Service.convertToEntranceModel(source.entrance)
        : undefined;
    result.exit =
      source.exit instanceof Object
        ? MappingV1Service.convertToEntranceModel(source.exit)
        : undefined;
    result.massif =
      source.massif instanceof Object
        ? MappingV1Service.convertToMassifModel(source.massif)
        : undefined;
    result.reviewer =
      source.reviewer instanceof Object
        ? MappingV1Service.convertToCaverModel(source.reviewer)
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

    result.author = MappingV1Service.convertToCaverModel(source.author);
    result.cave =
      source.cave instanceof Object
        ? MappingV1Service.convertToCaveModel(source.cave)
        : undefined;
    result.entrance =
      source.entrance instanceof Object
        ? MappingV1Service.convertToEntranceModel(source.entrance)
        : undefined;
    result.massif =
      source.massif instanceof Object
        ? MappingV1Service.convertToMassifModel(source.massif)
        : undefined;
    result.organization =
      source.grotto instanceof Object
        ? MappingV1Service.convertToOrganizationModel(source.grotto)
        : undefined;
    result.reviewer =
      source.reviewer instanceof Object
        ? MappingV1Service.convertToCaverModel(source.reviewer)
        : undefined;

    return result;
  },

  convertToEntranceModel: (source) => {
    const result = {
      ...EntranceModel,
    };

    result['@id'] = String(source.id);
    result.aestheticism = source.aestheticism;
    result.altitude = source.altitude;
    result.approach = source.approach;
    result.caving = source.caving;
    result.comments = source.comments;
    result.country = source.country;
    result.countryCode = source['country code'];
    result.county = source.county;
    result.city = source.city;
    result.discoveryYear = source.yearDiscovery;
    result.documents = source.documents;
    result.histories = source.histories;
    result.id = source.id;
    result.latitude = parseFloat(source.latitude);
    result.locations = source.locations;
    result.longitude = parseFloat(source.longitude);
    result.massif = ramda.pathOr(undefined, ['cave', 'massif'], source); // put the massif at the root of the entrance (more convenient for the client)
    result.name = MappingV1Service.getMainName(source);
    result.names = source.names;
    result.postalCode = source.postalCode;
    result.precision = source.precision;
    result.region = source.region;
    result.riggings = source.riggings;
    result.stats = source.stats;
    result.timeInfo = source.timeInfo;

    // Cave (DB or ES)
    if (source.cave instanceof Object) {
      result.cave = MappingV1Service.convertToCaveModel(source.cave);
    } else if (source['cave name']) {
      result.cave = {
        depth: source['cave depth'],
        length: source['cave length'],
        name: source['cave name'],
        isDiving: source['cave is diving'],
      };
    }

    // Author
    if (source.author instanceof Object) {
      result.author = MappingV1Service.convertToCaverModel(source.author);
    }

    // From ESearch
    if (source['massif name']) {
      result.massif = {
        name: source['massif name'],
      };
    }

    if (source.descriptions instanceof Array) {
      result.descriptions = MappingV1Service.convertToDescriptionList(
        source.descriptions,
      ).descriptions;
    } else {
      result.descriptions = source.descriptions;
    }

    return result;
  },

  convertToDescriptionList: (source) => {
    const descriptions = [];
    source.forEach((item) =>
      descriptions.push(MappingV1Service.convertToDescriptionModel(item)),
    );
    return { descriptions };
  },

  convertToEntranceList: (source) => {
    const entrances = [];
    source.forEach((item) =>
      entrances.push(MappingV1Service.convertToEntranceModel(item)),
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
      cavers.push(MappingV1Service.convertToCaverModel(item)),
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
    result.nickname = source.nickname;
    result.surname = source.surname;
    result.name = source.name;
    result.mail = source.mail;

    if (source.groups) {
      if (source.groups instanceof Array) {
        result.groups = source.groups;
      } else {
        result.groups = source.groups.split(',').map((groupId) => {
          return {
            id: parseInt(groupId, 10),
          };
        });
      }
    }

    if (source.documents) {
      if (source.documents instanceof Array) {
        result.documents = source.documents;
      } else {
        result.documents = source.documents.split(',').map((documentId) => {
          return {
            id: parseInt(documentId, 10),
          };
        });
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
    result.length = source.length;
    result.name = MappingV1Service.getMainName(source);
    result.names = source.names;
    result.temperature = source.temperature;

    if (source.id_author instanceof Object) {
      result.author = MappingV1Service.convertToCaverModel(source.id_author);
    }
    if (source.reviewer instanceof Object) {
      result.reviewer = MappingV1Service.convertToCaverModel(source.reviewer);
    }
    if (source.descriptions instanceof Array) {
      result.descriptions = MappingV1Service.convertToDescriptionList(
        source.descriptions,
      ).descriptions;
    }
    if (source.entrances instanceof Array) {
      result.entrances = MappingV1Service.convertToEntranceList(
        source.entrances,
      );
    }
    if (source.documents instanceof Array) {
      result.documents = MappingV1Service.convertToDocumentList(
        source.documents,
      ).documents;
    }
    if (source.id_massif instanceof Object) {
      result.massif = MappingV1Service.convertToMassifModel(source.id_massif);
    }
    return result;
  },

  convertToCaveList: (source) => {
    const caves = [];
    source.forEach((item) =>
      caves.push(MappingV1Service.convertToCaveModel(item)),
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
      switch (item['_source'].tags[0]) {
        case 'cave':
          data = MappingV1Service.convertToCaveModel(item['_source']);
          break;
        case 'caver':
          data = MappingV1Service.convertToCaverModel(item['_source']);
          break;
        case 'entrance':
          data = MappingV1Service.convertToEntranceModel(item['_source']);
          break;
        case 'massif':
          data = MappingV1Service.convertToMassifModel(item['_source']);
          break;
        case 'grotto':
          data = MappingV1Service.convertToOrganizationModel(item['_source']);
          break;
        case 'document':
          data = MappingV1Service.convertToDocumentModel(item['_source']);
          break;
        default:
      }
      // Add the type and hightlight of the data
      data.type = item['_source'].tags[0];
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
          id: item['_id'],
          name: item['_source'].name
            ? item['_source'].name
            : item['_source']['title'], // Handle title for documents (instead of name)
          type: item['_source'].tags[0],
          highlights: item.highlight,
        };

        if (item['_source'].longitude) {
          data.longitude = parseFloat(item['_source'].longitude);
        }
        if (item['_source'].latitude) {
          data.latitude = parseFloat(item['_source'].latitude);
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

        switch (item['_source'].tags[0]) {
          case 'entrance':
            data.cave = {
              id: item['_source'].id_cave,
              name: item['_source']['cave name'],
              depth: item['_source']['cave depth'],
              length: item['_source']['cave length'],
            };
            data.city = item['_source'].city;
            data.region = item['_source'].region;
            data.names = item['_source'].names;
            data.descriptions = item['_source'].descriptions;
            break;

          case 'grotto':
            data.names = item['_source'].names;
            data.address = item['_source'].address;
            break;

          case 'massif':
            data.names = item['_source'].names;
            data.descriptions = item['_source'].descriptions;
            break;

          case 'document':
          case 'document-collection':
          case 'document-issue':
            // Rename keys of source and highlights
            // 08/2020 - C. ROIG - Not needed at the moment but keep in case
            // renameKeys(item['_source'], replacementKeys);
            // renameKeys(data.highlights, replacementKeys);

            // Fill data with appropriate keys
            for (let key in item['_source']) {
              data[key] = item['_source'][key];
            }

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
            data.surname = item['_source'].surname;
            data.nickname = item['_source'].nickname;
            data.mail = item['_source'].mail;

          case 'cave':
            data.depth = item['_source'].depth;
            data.descriptions = item['_source'].descriptions;
            data.isDiving = item['_source'].is_diving;
            data.length = item['_source'].length;
            data.names = item['_source'].names;
            data.sizeCoef = item['_source'].size_coef;
            data.temperature = item['_source'].temperature;
          default:
        }
        values.push(data);
      });
    }

    res.results = values;
    res.totalNbResults = source.hits.total.value;
    return res;
  },

  // ---------------- Massif Function ------------------------------

  convertToMassifModel: (source) => {
    const result = {
      ...MassifModel,
    };

    if (source.author) {
      result.author = MappingV1Service.convertToCaverModel(source.author);
    }

    // Caves (from DB)
    if (source.caves) {
      result.caves = MappingV1Service.convertToCaveList(source.caves);
    }

    // Nb caves & entrances (from ES)
    result.nbCaves = ramda.pathOr(undefined, ['nb caves'], source);
    result.nbEntrances = ramda.pathOr(undefined, ['nb entrances'], source);

    result.id = source.id;
    result['@id'] = String(source.id);
    result.author = source.author;
    result.name = MappingV1Service.getMainName(source);
    result.names = source.names;
    result.dateInscription = source.dateInscription;
    result.dateReviewed = source.dateReviewed;
    result.reviewer = source.reviewer;

    if (source.descriptions instanceof Array) {
      result.descriptions = MappingV1Service.convertToDescriptionList(
        source.descriptions,
      ).descriptions;
    } else {
      result.descriptions = source.descriptions;
    }

    return result;
  },

  // ---------------- Grotto Function ---------------------------

  convertToOrganizationModel: (source) => {
    const result = {
      ...OrganizationModel,
    };

    // Convert cavers
    if (source.cavers instanceof Array) {
      result.cavers = source.cavers.map((caver) =>
        MappingV1Service.convertToCaverModel(caver),
      );
    } else {
      result.nbCavers = ramda.pathOr(undefined, ['nb cavers'], source);
    }

    // Convert caves
    if (source.exploredCaves instanceof Array) {
      result.exploredCaves = MappingV1Service.convertToCaveList(
        source.exploredCaves,
      );
    }
    if (source.partneredCaves instanceof Array) {
      result.partneredCaves = MappingV1Service.convertToCaveList(
        source.partneredCaves,
      );
    }

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
    result.name = MappingV1Service.getMainName(source);
    result.names = source.names;
    result.mail = source.mail;
    result.pictureFileName = source.pictureFileName;
    result.postalCode = source.postalCode;
    result.region = source.region;
    result.url = source.url;
    result.village = source.village;
    result.yearBirth = source.yearBirth;

    return result;
  },

  // ---------------- Document Function ---------------------------

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
    result.author = source.author;
    result.authorComment = source.authorComment;
    result.authorizationDocument = source.authorizationDocument
      ? module.exports.convertToDocumentModel(source.authorizationDocument)
      : null;
    result.cave = source.cave;
    result.dateInscription = source.dateInscription;
    result.datePublication = source.date_publication
      ? source.date_publication
      : source.datePublication;
    result.dateValidation = source.dateValidation;
    result.deletedFiles = source.deletedFiles;
    result.entrance = source.entrance;
    result.files =
      source.files &&
      source.files.map((file) => MappingV1Service.convertToFileModel(file));
    result.identifier = source.identifier;
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
          (id) => (id ? id.trim() : id),
        )(source),
      };
    } else {
      result.identifierType = source.identifierType;
    }

    // Convert authors
    if (source.authors instanceof Array) {
      result.authors = MappingV1Service.convertToCaverList(
        source.authors,
      ).cavers;
    } else {
      result.authors = source.authors;
    }

    // Convert children document
    if (source.children instanceof Array) {
      result.children = MappingV1Service.convertToDocumentList(
        source.children,
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
          ? source.regions.split(', ').map((r) => {
              return {
                name: r,
              };
            })
          : null;
      }
    }

    // Convert subjects
    if (source.subjects instanceof Array) {
      result.subjects = MappingV1Service.convertToSubjectList(
        source.subjects,
      ).subjects;
    } else {
      // ES
      result.subjects = source.subjects
        ? source.subjects.split(', ').map((s) => {
            return {
              code: s,
            };
          })
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
    } else {
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
    }

    return result;
  },

  convertToDocumentList: (source) => {
    const documents = [];
    source.forEach((item) =>
      documents.push(MappingV1Service.convertToDocumentModel(item)),
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
        ? MappingV1Service.convertToSubjectModel(source.parent)
        : null;
    return result;
  },

  convertToSubjectList: (source) => {
    const subjects = [];
    source.forEach((item) =>
      subjects.push(MappingV1Service.convertToSubjectModel(item)),
    );
    return {
      subjects,
    };
  },
};
