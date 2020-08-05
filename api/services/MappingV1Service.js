/* eslint-disable dot-notation */
/**
 * Mapper for API V1 models
 *
 * BE CAREFULL Any change here must be reported on file apiV1.yaml!
 */

const ramda = require('ramda');

/* Models */

const EntranceModel = {
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
};

const CountResult = {
  count: undefined,
};

const MassifModel = {
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
};

const CaveModel = {
  id: undefined,
  name: undefined,
  names: undefined,
  descriptions: [],
  minDepth: undefined,
  maxDepth: undefined,
  depth: undefined,
  length: undefined,
  isDiving: undefined,
  temperature: undefined,
  author: undefined,
  massif: undefined,
};

const DocumentModel = {
  refBbs: undefined,
  title: undefined,
  publicationDate: undefined,
  bbs: undefined,
  subjects: undefined,
  theme: undefined,
  country: undefined,
  library: undefined,
  editor: undefined,
  regions: undefined,
};

const SubjectModel = {
  code: undefined,
  subject: undefined,
  parent: undefined,
};

/* Mappers */

module.exports = {
  convertToEntranceModel: (source) => {
    const result = { ...EntranceModel };

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
    result.descriptions = source.descriptions;
    result.country = source.Country || source.country;
    result.countryCode = source['country code'];
    result.county = source.county;
    result.region = source.Region || source.region;
    result.city = source.City || source.city;
    result.postalCode = source.postalCode;
    result.latitude = source.Latitude || source.latitude;
    result.longitude = source.Longitude || source.longitude;
    result.altitude = source.Altitude;
    result.aestheticism = source.aestheticism;
    result.approach = source.approach;
    result.caving = source.caving;
    result.documents = source.documents;
    result.stats = source.stats;
    result.timeInfo = source.timeInfo;

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
    const result = { ...CountResult };
    result.count = source.count;
    return result;
  },

  convertToCaverModel: (source) => {
    const result = { ...CaverModel };
    result.id = source.id;
    result.nickname = source.nickname;
    return result;
  },

  convertToCaveModel: (source) => {
    const result = { ...CaveModel };
    result.id = source.id;

    let mainName = source.names.find((name) => name.isMain);
    mainName = mainName === undefined ? undefined : mainName.name;

    result.name = mainName;
    result.names = source.names;
    result.minDepth = source.minDepth;
    result.maxDepth = source.maxDepth;
    result.depth = source.depth;
    result.length = source.length;
    result.isDiving = source.isDiving;
    result.temperature = source.temperature;
    if (source.author instanceof Object) {
      result.author = MappingV1Service.convertToCaverModel(source.author);
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

        data.longitude = item['_source'].longitude;
        data.latitude = item['_source'].latitude;

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
            // Rename keys of source and highlights
            // 08/2020 - C. ROIG - Not needed at the moment but keep in case
            // renameKeys(item['_source'], replacementKeys);
            // renameKeys(data.highlights, replacementKeys);

            // Fill data with appropriate keys
            for (let key in item['_source']) {
              data[key] = item['_source'][key];
            }

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

  // ---------------- Massif Function ------------------------------

  convertToMassifModel: (source) => {
    const result = { ...MassifModel };

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
    const result = { ...GrottoModel };

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
    result.latitude = source.latitude;
    result.longitude = source.longitude;
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
    const result = { ...DocumentModel };

    // Don't return the abstract from Elasticsearch ('bbs abstract') = too big and useless as a search results
    result.description = source.description;

    // Conversion (from Elasticsearch or not)
    result.id = source.id;
    result.refBbs = source.ref_bbs;
    result.bbs = source.bbs;
    result.title = source.title;
    result.publicationDate = source.date_publication;

    // TODO: handle authors as a string (ES)
    result.authors = source.authors;

    // TODO: handle publication (old bbs & parent)
    result.publication = source.publication_other_bbs_old;

    // Build regions
    if (source.regions) {
      if (source.regions instanceof Array) {
        result.regions = source.regions;
      } else {
        // ES
        result.regions = source.regions.split(', ').map((r) => {
          return {
            name: r,
          };
        });
      }
    }
    // Build subjects
    if (source.subjects) {
      if (source.subjects instanceof Array) {
        result.subjects = source.subjects;
      } else {
        // ES
        result.subjects = source.subjects.split(', ').map((s) => {
          return {
            code: s,
          };
        });
      }
    }

    // Build library
    if (source.library) {
      result.library = source.library;
    } else {
      // ES
      result.library = {
        id: source['library id'],
        name: source['library name'],
      };
    }

    // Build editor
    if (source.editor) {
      result.editor = source.editor;
    } else {
      // ES
      result.editor = {
        id: source['editor id'],
        name: source['editor name'],
      };
    }

    return result;
  },

  convertToSubjectModel: (source) => {
    const result = { ...SubjectModel };
    result.code = source.id;
    result.subject = source.subject;
    result.parent = source.parent;
    return result;
  },

  convertToSubjectList: (source) => {
    const subjects = [];
    source.forEach((item) =>
      subjects.push(MappingV1Service.convertToSubjectModel(item)),
    );
    return subjects;
  },
};
