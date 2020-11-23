/* eslint-disable dot-notation */
/**
 * Mapper for API V1 models
 *
 * BE CAREFULL Any change here must be reported on file apiV1.yaml!
 */

const ramda = require('ramda');

/* Models */

const EntranceModel = {
  // See this issue for more info: https://github.com/GrottoCenter/Grottocenter3/issues/416
  '@base': 'entrances/',
  '@id': undefined,
  '@type': 'https://ontology.uis-speleo.org/ontology/#UndergroundCavity',
  id: undefined,
  name: undefined,
  names: undefined,
  descriptions: [],
  country: undefined,
  countryCode: undefined,
  county: undefined,
  region: undefined,
  city: undefined,
  postalCode: undefined,
  latitude: undefined,
  longitude: undefined,
  altitude: undefined,
  cave: undefined,
  massif: undefined,
  aestheticism: undefined,
  caving: undefined,
  approach: undefined,
  documents: [],
  stats: undefined,
  timeInfo: undefined,
  locations: [],
  documents: [],
  riggings: [],
  comments: [],
};

const CountResult = {
  count: undefined,
};

const MassifModel = {
  // See this issue for more info: https://github.com/GrottoCenter/Grottocenter3/issues/416
  '@context': 'https://ontology.uis-speleo.org/grottocenter.org_context.jsonld',
  '@id': undefined,
  '@type': 'http://purl.org/dc/terms/Location',
  id: undefined,
  author: undefined,
  reviewer: undefined,
  name: undefined,
  dateInscription: undefined,
  dateReviewed: undefined,
  caves: [],
  descriptions: [],
};

const GrottoModel = {
  id: undefined,
  name: undefined,
  country: undefined,
  countryCode: undefined,
  region: undefined,
  city: undefined,
  postalCode: undefined,
  address: undefined,
  contact: undefined,
  yearBirth: undefined,
  latitude: undefined,
  longitude: undefined,
  customMessage: undefined,
  pictureFileName: undefined,
  isOfficialPartner: undefined,
  village: undefined,
  county: undefined,
  documentary: undefined,
  URL: undefined,
  Facebook: undefined,
  cavers: [],
  exploredCaves: [],
  partneredCaves: [],
};

const CaverModel = {
  id: undefined,
  nickname: undefined,
  surname: undefined,
  name: undefined,
  mail: undefined,
  groups: [],
};

const CaveModel = {
  // See this issue for more info: https://github.com/GrottoCenter/Grottocenter3/issues/416
  '@id': undefined,
  id: undefined,
  name: undefined,
  names: [],
  descriptions: [],
  depth: undefined,
  length: undefined,
  isDiving: undefined,
  temperature: undefined,
  author: undefined,
  massif: undefined,
  entrances: [],
  documents: [],
};

const DocumentModel = {
  author: undefined,
  cave: undefined,
  country: undefined,
  dateInscription: undefined,
  datePublication: undefined,
  dateValidation: undefined,
  descriptions: [],
  editor: undefined,
  entrance: undefined,
  identifierType: undefined,
  languages: [],
  library: undefined,
  license: undefined,
  mainLanguage: undefined,
  massif: undefined,
  pages: undefined,
  pathOld: undefined,
  refBbs: undefined,
  regions: undefined,
  reviewer: undefined,
  subjects: undefined,
  theme: undefined,
  title: undefined,
  titles: [],
  type: undefined,
};

const SubjectModel = {
  code: undefined,
  subject: undefined,
  parent: undefined,
};

/* Mappers */

module.exports = {
  convertToEntranceModel: (source) => {
    const result = {
      ...EntranceModel,
    };

    // Build the result
    // In ES, the name is already set. When coming from the DB, it's not.
    let mainName = ramda.pathOr(null, ['name'], source);
    if (mainName === null && source.names instanceof Array) {
      mainName = source.names.find((name) => name.isMain);
      mainName = mainName === undefined ? null : mainName.name;
    }
    result.name = mainName;
    result.names = source.names;

    // Cave (DB or ES)
    if (source.cave) {
      result.cave = source.cave;
    } else if (source['cave name']) {
      result.cave = {
        depth: source['cave depth'],
        length: source['cave length'],
        name: source['cave name'],
        isDiving: source['cave is diving'],
      };
    }

    // Massif  (DB or ES)
    if (source.massif) {
      result.massif = source.massif;
    } else if (source['massif name']) {
      result.massif = {
        name: source['massif name'],
      };
    }

    result.id = source.id;
    result['@id'] = String(source.id);
    result.descriptions = source.descriptions;
    result.country = source.country;
    result.countryCode = source['country code'];
    result.county = source.county;
    result.region = source.region;
    result.city = source.city;
    result.postalCode = source.postalCode;
    result.latitude = parseFloat(source.latitude);
    result.longitude = parseFloat(source.longitude);
    result.aestheticism = source.aestheticism;
    result.approach = source.approach;
    result.caving = source.caving;
    result.documents = source.documents;
    result.stats = source.stats;
    result.timeInfo = source.timeInfo;
    result.locations = source.locations;
    result.riggings = source.riggings;
    result.comments = source.comments;

    return result;
  },

  convertToEntranceList: (source) => {
    const entrances = [];
    source.forEach((item) =>
      entrances.push(MappingV1Service.convertToEntranceModel(item)),
    );
    return entrances;
  },

  convertToCountResult: (source) => {
    const result = {
      ...CountResult,
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
    return result;
  },

  convertToCaveModel: (source) => {
    const result = {
      ...CaveModel,
    };
    result.id = source.id;
    result['@id'] = String(source.id);

    let mainName = source.names.find((name) => name.isMain);
    mainName = mainName === undefined ? undefined : mainName.name;

    result.name = mainName;
    result.names = source.names;
    result.descriptions = source.descriptions;
    result.depth = source.depth;
    result.length = source.length;
    result.isDiving = source.isDiving;
    result.temperature = source.temperature;

    if (source.author instanceof Object) {
      result.author = MappingV1Service.convertToCaverModel(source.author);
    }
    if (source.reviewer instanceof Object) {
      result.reviewer = MappingV1Service.convertToCaverModel(source.reviewer);
    }
    if (source.entrances instanceof Array) {
      result.entrances = MappingV1Service.convertToEntranceList(
        source.entrances,
      );
    }
    if (source.documents instanceof Array) {
      result.documents = MappingV1Service.convertToDocumentList(
        source.documents,
      );
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
      // Convert the data according to its type
      switch (item['_source'].type) {
        case 'entrance':
          data = MappingV1Service.convertToEntranceModel(item['_source']);
          break;
        case 'massif':
          data = MappingV1Service.convertToMassifModel(item['_source']);
          break;
        case 'grotto':
          data = MappingV1Service.convertToGrottoModel(item['_source']);
          break;
        case 'document':
          data = MappingV1Service.convertToDocumentModel(item['_source']);
          break;
        case 'caver':
          data = MappingV1Service.convertToCaverModel(item['_source']);
          break;
        default:
      }
      // Add the type and hightlight of the data
      data.type = item['_source'].type;
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
          type: item['_source'].type,
          highlights: item.highlight,
        };

        data.longitude = parseFloat(item['_source'].longitude);
        data.latitude = parseFloat(item['_source'].latitude);

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

        switch (item['_source'].type) {
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

    // Build the result
    // In ES, the name is already set. When coming from the DB, it's not.
    let mainName = ramda.pathOr(null, ['name'], source);
    if (mainName === null && source.names instanceof Array) {
      mainName = source.names.find((name) => name.isMain);
      mainName = mainName === undefined ? null : mainName.name;
    }

    result.id = source.id;
    result['@id'] = String(source.id);
    result.descriptions = source.descriptions;
    result.reviewer = source.reviewer;
    result.name = mainName;
    result.names = source.names;
    result.dateInscription = source.dateInscription;
    result.dateReviewed = source.dateReviewed;

    return result;
  },

  // ---------------- Grotto Function ---------------------------

  convertToGrottoModel: (source) => {
    const result = {
      ...GrottoModel,
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

    // Build the result
    // In ES, the name is already set. When coming from the DB, it's not.
    let mainName = ramda.pathOr(null, ['name'], source);
    if (mainName === null && source.names instanceof Array) {
      mainName = source.names.find((name) => name.isMain);
      mainName = mainName === undefined ? null : mainName.name;
    }

    result.name = mainName;
    result.names = source.names;
    result.id = source.id;
    result.country = source.country;
    result.countryCode = source['country code'];
    result.county = source.county;
    result.region = source.region;
    result.city = source.city;
    result.postalCode = source.postalCode;
    result.latitude = parseFloat(source.latitude);
    result.longitude = parseFloat(source.longitude);
    result.address = source.address;
    result.mail = source.mail;
    result.yearBirth = source.yearBirth;
    result.customMessage = source.customMessage;
    result.pictureFileName = source.pictureFileName;
    result.isOfficialPartner = source.isOfficialPartner;
    result.village = source.village;
    result.documentary = source.documentary;
    result.URL = source.URL;
    result.Facebook = source.Facebook;

    return result;
  },

  // ---------------- Document Function ---------------------------

  convertToDocumentModel: (source) => {
    const result = {
      ...DocumentModel,
    };

    // Conversion (from Elasticsearch or not)
    result.id = source.id;
    result.author = source.author;
    result.cave = source.cave;
    result.dateInscription = source.dateInscription;
    result.datePublication = source.date_publication
      ? source.date_publication
      : source.datePublication;
    result.dateValidation = source.dateValidation;
    result.entrance = source.entrance;
    result.identifier = source.identifier;
    result.identifierType = {
      ...source.identifierType,
      id: ramda.pipe(ramda.pathOr(undefined, ['identifierType', 'id']), (id) =>
        id ? id.trim() : id,
      )(source),
    };
    result.languages = source.languages;
    result.license = source.license;
    result.mainLanguage = source.mainLanguage;
    result.massif = source.massif;
    result.pages = source.pages;
    result.pathOld = source.pathOld;
    result.parent = source.parent
      ? module.exports.convertToDocumentModel(source.parent)
      : null;
    result.publicationFasciculeBBSOld = source.publicationFasciculeBBSOld;
    result.refBbs = source.ref_bbs ? source.ref_bbs : source.refBbs;
    result.reviewer = source.reviewer;
    result.title = source.title;

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

    if (source.authors instanceof Array) {
      result.authors = MappingV1Service.convertToCaverList(
        source.authors,
      ).cavers;
    } else {
      result.authors = source.authors;
    }

    // TODO: handle publication (old bbs & parent)
    result.publication = source.publication_other_bbs_old
      ? source.publication_other_bbs_old
      : source.publicationOtherBBSOld;

    // Build regions
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

    // Build subjects
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

    // Build library
    if (source['library id']) {
      // ES
      result.library = {
        id: source['library id'],
        name: source['library name'],
      };
    } else {
      result.library = source.library;
    }

    // Build editor
    if (source['editor id']) {
      // ES
      result.editor = {
        id: source['editor id'],
        name: source['editor name'],
      };
    } else {
      result.editor = source.editor;
    }

    // Build type
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
