'use strict';
/**
 * Mapper for API V1 models
 *
 * BE CAREFULL Any change here must be reported on file apiV1.yaml!
 */

/* Models */

const EntryModel = {
  id: undefined,
  name: undefined,
  country: undefined,
  county: undefined,
  region: undefined,
  city: undefined,
  postalCode : undefined,
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
  count: undefined
};

const MassifModel = {
  id: undefined,
  author: undefined,
  idReviewer: undefined,
  name: undefined,
  dateInscription: undefined,
  dateReviewed: undefined,
  caves: [],
  entries: []
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
  entries: [],
};

const CaverModel = {
  id: undefined,
  nickname: undefined
};

const CaveModel = {
  id: undefined,
  name: undefined,
  minDepth: undefined,
  maxDepth: undefined,
  depth: undefined,
  length: undefined,
  isDiving: undefined,
  temperature: undefined,
  author: undefined,
  massif: undefined,
};

const BbsModel = {
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
};

const BbsChapterModel = {
  id: undefined,
  name: undefined,
  theme: undefined,
};

/* Mappers */

module.exports = {
  convertToEntryModel: function(source) {
    let result = Object.assign({}, EntryModel);

    result.id = source.id;
    result.name = source.name;
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
      name: source['massif name']
    };
    return result;
  },

  convertToEntryList: function(source) {
    let entries = [];
    source.forEach((item) => {
      let entry = this.convertToEntryModel(item);
      entries.push(entry);
    });
    return entries;
  },

  convertToCountResult: function(source) {
    let result = Object.assign({}, CountResult);
    result.count = source.count;
    return result;
  },

  //Deprecated for v1
  convertDbToSearchResult: function(source) {
    let results = {};
    let entries = [];
    source.forEach((item) => {
      let entry = this.convertToEntryModel(item);
      entries.push(entry);
    });
    results.entries = entries;
    return results;
  },

  convertToCaverModel: function(source) {
    let result = Object.assign({}, CaverModel);
    result.id = source.id;
    result.nickname = source.nickname;
    return result;
  },

  convertToCaveModel: function(source) {
    let result = Object.assign({}, CaveModel);
    result.id = source.id;
    result.name = source.name;
    result.minDepth = source.minDepth;
    result.maxDepth = source.maxDepth;
    result.depth = source.depth;
    result.length = source.length;
    result.isDiving = source.isDiving;
    result.temperature = source.temperature;
    if (source.author instanceof Object) {
      result.author = this.convertToCaverModel(source.author);
    }
    return result;
  },

  convertToCaveList: function(source) {
    let caves = [];
    source.forEach((item) => {
      let cave = this.convertToCaveModel(item);
      caves.push(cave);
    });
    return caves;
  },

  /**
   * Function that return all data for the search
   * @param {*} source : the elasticsearch result
   */
  convertToCompleteSearchResult: function(source) {
    let res = {};
    let values = [];

    // For each result of the research, convert the item and add it to the json to send
    source.hits.hits.forEach((item) => {
      let data = '';
      // Convert the data according to its type
      switch(item._source.type){
        case 'entry':
          data = this.convertToEntryModel(item._source);
          break;
        case 'massif':
          data = this.convertToMassifModel(item._source);
          break;
        case 'grotto':
          data = this.convertToGrottoModel(item._source);
          break;
        case 'bbs': 
          data = this.convertToBbsModel(item._source);
          break;
      }
      // Add the type and hightlight of the data
      data.type = item._source.type;
      data.highlights = item.highlight;

      values.push(data);
    });
    res.results = values;
    res.totalNbResults = source.hits.total;
    return res;
  },

  /**
   * Function that return only the main information about a result.
   * @param {*} source : the elasticsearch result
   */
  convertEsToSearchResult: function(source) {
    let res = {};
    let values = [];

    // For each result of the research, only keep the id and the name then add it to the json to send
    source.hits && source.hits.hits.forEach((item) => {
      let data = {
        id: item._id,
        name: item._source.name ? item._source.name : item._source['bbs title'], // Handle BBS case
        type: item._source.type,
        highlights: item.highlight
      };
      
      data.longitude = item._source.longitude;
      data.latitude = item._source.latitude;
      
      switch(item._source.type){
        case 'entry':
          data.cave = {
            id: item._source.id_cave,
            name: item._source['cave name'],
            depth: item._source['cave depth'],
            length: item._source['cave length'],
          };
          data.city = item._source.city;
          data.region = item._source.region;
          break;

        case 'grotto':
          data.address = item._source.address;
          break;

        case 'bbs': {
          // Convert from a collection of keys newKeys, rename the keys of obj
          const renameKeys = (obj, newKeys) => {
            const keyValues = Object.keys(obj).map(key => {
              const newKey = newKeys[key] || key;
              return { [newKey]: obj[key] };
            });
            return Object.assign({}, ...keyValues);
          };

          const replacementKeys = { 
            'bbs title': 'title', 
            'bbs ref' : 'reference', 
            'bbs authors' : 'authors', 
            'bbs theme' : 'theme',
            'bbs subtheme' : 'subtheme',
            'bbs abstract' : 'abstract',
            'bbs country': 'country',
            'refnumerique' : 'numerical reference'
          };
          // Rename keys of data and highlights
          const newSource = renameKeys(item._source, replacementKeys);
          data.highlights = renameKeys(data.highlights, replacementKeys);
          
          // Fill data with appropriate key
          let newKey; 
          for(const key in replacementKeys) {
            newKey = replacementKeys[key];
            data[newKey] = newSource[newKey];
          }          
          break;
        }
      }
      values.push(data);
    });

    res.results = values;
    res.totalNbResults = source.hits ? source.hits.total : 0;
    return res;
  },

  // ---------------- Massif Function ------------------------------

  convertToMassifModel: function(source) {
    let result = Object.assign({}, MassifModel);

    if(source.author) {
      result.author = this.convertToCaverModel(source.author);
    }

    if(source.caves) {
      result.caves = source.caves.map(cave => this.convertToCaveModel(cave));
    } else if (source['caves names']) {
      // In Elasticsearch
      result.caves = source['caves names'].split(',').map(name => this.convertToCaveModel({name}));
    }

    if(source.entries) {
      result.entries = source.entries.map(entries => this.convertToEntryModel(entries));
    } else if (source['entries names']) {
      // In Elasticsearch
      result.entries = source['entries names'].split(',').map(name => this.convertToEntryModel({name}));
    }
    
    // Save in result the object to return
    result.id = source.id;
    result.idReviewer = source.idReviewer;
    result.name = source.name;
    result.dateInscription = source.dateInscription;
    result.dateReviewed = source.dateReviewed;

    return result;
  },

  // ---------------- Grotto Function ---------------------------

  convertToGrottoModel: function(source) {
    let result = Object.assign({}, GrottoModel);

    if(source.cavers && source.cavers instanceof Array) {
      result.cavers = source.cavers.map(caver => this.convertToCaverModel(caver));
    } else if (source['cavers names']) {
      // In Elasticsearch, cavers names are the nicknames separated with a ','
      result.cavers = source['cavers names'].split(',').map(nickname => this.convertToCaverModel({nickname}));
    }

    if(source.entries) {
      result.entries = source.entries.map(entry => this.convertToEntryModel(entry));
    }

    // Build the result
    result.id = source.id;
    result.name = source.name;
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

  convertToBbsModel: function(source) {
    let result = Object.assign({}, BbsModel);
    result.publicationExport = source.publicationExport;
    result.crosChapRebuilt = source.crosChapRebuilt;
    result.crosCountryRebuilt = source.crosCountryRebuilt;
    
    // Don't return the abstract from Elasticsearch ('bbs abstract') = too big and useless as a search results
    result.abstract = source.abstract;

    // Conversion (from Elasticsearch or not)
    result.numericalRef = source['bbs refnumerique'] ? source['bbs refnumerique'] : source.xRefNumeriqueFinal;
    result.ref_ = source['bbs ref'] ? source['bbs ref'] : source.ref_;
    result.id = source.id ? source.id : result.ref_; // Use ref_ as a fallback id
    result.title = source['bbs title'] ? source['bbs title'] : source.articleTitle;
    result.year = source['bbs year'] ? source['bbs year'] : source.articleYear;
    result.authors = source['bbs authors'] ? source['bbs authors'] : source.cAuthorsFull;  
    
    // Build country / region
    if (source['bbs country code'] || source.country) {
      result.country = {
        id: source['bbs country code'] ? source['bbs country code'] : source.country.id,
        name: source['bbs country'] ? source['bbs country'] : source.country.country
      };
    }

    // Build (sub)theme
    if(source['bbs chaptercode'] || source.chapter) {
      // In ES, the french and english theme and subtheme names are gathered and separated by ' / '
      result.theme = source['bbs theme'] ? source['bbs theme'].split(' / ')[0] : source.chapter.cTexteMatiere;
      result.subtheme = {
        id: source['bbs chaptercode'] ? source['bbs chaptercode'] : source.chapter.id,
        name: source['bbs subtheme'] ? source['bbs subtheme'].split(' / ')[0] : source.chapter.cTexteChapitre
      };     
    }

    return result;
  },

  convertToBbsGeoModel: function(source) {
    return source;
  },

  convertToBbsChapterModel: function(source) {
    let result = Object.assign({}, BbsChapterModel);
    result.id = source.id;
    result.name = source.cTexteMatiere;
    result.theme = source.cTexteChapitre;
    return result;
  },

  convertToBbsChapterList: function(source) {
    let chapters = [];
    source.forEach((item) => {
      let chapter = this.convertToBbsChapterModel(item);
      chapters.push(chapter);
    });
    return chapters;
  }
};