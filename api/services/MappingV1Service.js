/* eslint-disable dot-notation */
/**
 * Mapper for API V1 models
 *
 * BE CAREFULL Any change here must be reported on file apiV1.yaml!
 */

/* Models */

const EntranceModel = {
  id: undefined,
  name: undefined,
  names: undefined,
  descriptions: [],
  country: undefined,
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
};

const CountResult = {
  count: undefined,
};

const MassifModel = {
  id: undefined,
  author: undefined,
  idReviewer: undefined,
  name: undefined,
  dateInscription: undefined,
  dateReviewed: undefined,
  caves: [],
  entries: [],
  descriptions: [],
};

const GrottoModel = {
  id: undefined,
  name: undefined,
  country: undefined,
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
  ref_: undefined,
  xRefNumeriqueFinal: undefined,
  title: undefined,
  year: undefined,
  publicationExport: undefined,
  crosChapRebuilt: undefined,
  crosCountryRebuilt: undefined,
  theme: undefined,
  subtheme: undefined,
  country: undefined,
  lib: undefined,
  editor: undefined,
};

const BbsChapterModel = {
  id: undefined,
  name: undefined,
  theme: undefined,
};

/* Mappers */

module.exports = {
  convertToEntranceModel: (source) => {
    const result = { ...EntranceModel };

    let mainName = source.names.find((name) => name.isMain);
    mainName = mainName === undefined ? '' : mainName.name;

    result.name = mainName;
    result.names = source.names;

    result.id = source.id;
    result.descriptions = source.descriptions;
    result.country = source.Country || source.country;
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
    result.cave = {
      depth: source['cave depth'],
      length: source['cave length'],
      name: source['cave name'],
    };
    result.massif = {
      name: source['massif name'],
    };
    return result;
  },

  convertToEntryList: (source) => {
    const entries = [];
    source.forEach((item) =>
      entries.push(MappingV1Service.convertToEntranceModel(item)),
    );
    return entries;
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
    mainName = mainName === undefined ? '' : mainName.name;

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

    // For each result of the research, only keep the id and the name then add it to the json to send
    if (source.hits) {
      source.hits.hits.forEach((item) => {
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

        const replacementKeys = {
          'bbs title': 'title',
          'bbs ref': 'reference',
          'bbs authors': 'authors',
          'bbs theme': 'theme',
          'bbs subtheme': 'subtheme',
          'bbs abstract': 'abstract',
          'bbs country': 'country',
          'bbs publication': 'publication',
        };

        // Convert from a collection of keys newKeys, rename the keys of obj
        const renameKeys = (obj, newKeys) => {
          Object.keys(obj).map((key) => {
            if (newKeys[key]) {
              obj[newKeys[key]] = obj[key];
              delete obj[key];
            }
          });
        };

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
            break;

          case 'grotto':
            data.address = item['_source'].address;
            break;

          case 'document':
            // Rename keys of source and highlights
            renameKeys(item['_source'], replacementKeys);
            renameKeys(data.highlights, replacementKeys);

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

    // Caves
    if (source.caves) {
      result.caves = MappingV1Service.convertToCaveList(source.caves);
    } else if (source['caves names']) {
      // In Elasticsearch
      result.caves = source['caves names']
        .split(',')
        .map((name) => MappingV1Service.convertToCaveModel({ name }));
    }

    // Save in result the object to return
    let mainName = source.names.find((name) => name.isMain);
    mainName = mainName === undefined ? '' : mainName.name;

    result.id = source.id;
    result.descriptions = source.descriptions;
    result.idReviewer = source.idReviewer;
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
    if (source.cavers && source.cavers instanceof Array) {
      result.cavers = source.cavers.map((caver) =>
        MappingV1Service.convertToCaverModel(caver),
      );
    } else if (source['cavers names']) {
      // In Elasticsearch, cavers names are the nicknames separated with a ','
      result.cavers = source['cavers names']
        .split(',')
        .map((nickname) => MappingV1Service.convertToCaverModel({ nickname }));
    }

    // Convert caves
    if (source.exploredCaves && source.exploredCaves instanceof Array) {
      result.exploredCaves = MappingV1Service.convertToCaveList(
        source.exploredCaves,
      );
    }
    if (source.partneredCaves && source.partneredCaves instanceof Array) {
      result.partneredCaves = MappingV1Service.convertToCaveList(
        source.partneredCaves,
      );
    }

    // Build the result
    let mainName = source.names.find((name) => name.isMain);
    mainName = mainName === undefined ? '' : mainName.name;

    result.name = mainName;
    result.names = source.names;
    result.id = source.id;
    result.country = source.country;
    result.county = source.county;
    result.region = source.region;
    result.city = source.city;
    result.postalCode = source.postalCode;
    result.latitude = source.latitude;
    result.longitude = source.longitude;
    result.address = source.address;
    result.contact = source.contact;
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

  // ---------------- BBS Function ---------------------------

  convertToDocumentModel: (source) => {
    const result = { ...DocumentModel };
    result.crosChapRebuilt = source.crosChapRebuilt;
    result.crosCountryRebuilt = source.crosCountryRebuilt;

    // Don't return the abstract from Elasticsearch ('bbs abstract') = too big and useless as a search results
    result.abstract = source.abstract;

    // Conversion (from Elasticsearch or not)
    result.ref = source['ref_bbs'] ? source['ref_bbs'] : source['refBbs'];
    result.id = source.id;
    result.title = source['bbs title']
      ? source['bbs title']
      : source.articleTitle;
    result.year = source['bbs year'] ? source['bbs year'] : source.articleYear;
    result.authors = source['bbs authors']
      ? source['bbs authors']
      : source.cAuthorsFull;
    result.publication = source['bbs publication']
      ? source['bbs publication']
      : source.publicationExport;
    // Build country / region
    if (source['bbs country code'] || source.country) {
      result.country = {
        id: source['bbs country code']
          ? source['bbs country code']
          : source.country.id,
        name: source['bbs country']
          ? source['bbs country']
          : source.country.country,
      };
    }

    // Build (sub)theme
    if (source['bbs chaptercode'] || source.chapter) {
      // In ES, the french and english theme and subtheme names are gathered and separated by ' / '
      result.theme = source['bbs theme']
        ? source['bbs theme'].split(' / ')[0]
        : source.chapter.cTexteChapitre;
      result.subtheme = {
        id: source['bbs chaptercode']
          ? source['bbs chaptercode']
          : source.chapter.id,
        name: source['bbs subtheme']
          ? source['bbs subtheme'].split(' / ')[0]
          : source.chapter.cTexteMatiere,
      };
    }

    // Build library
    if (source.lib) {
      result.lib = {
        id: source.lib.id,
        name: source.lib.nomCentre,
        country: source.lib.pays,
      };
    }

    // Build editor
    result.editor = {};
    result.editor.address = source.editorAddress ? source.editorAddress : '';
    result.editor.email = source.editorEmail ? source.editorEmail : '';
    result.editor.url = source.editorUrl ? source.editorUrl : '';

    return result;
  },

  convertToBbsGeoModel: (source) => source,

  convertToBbsChapterModel: (source) => {
    const result = { ...BbsChapterModel };
    result.id = source.id;
    result.name = source.cTexteMatiere;
    result.theme = source.cTexteChapitre;
    return result;
  },

  convertToBbsChapterList: (source) => {
    const chapters = [];
    source.forEach((item) =>
      chapters.push(MappingV1Service.convertToBbsChapterModel(item)),
    );
    return chapters;
  },
};
