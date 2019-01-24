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
  author: {},
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

/* Mappers */

module.exports = {
  convertToEntryModel: function(source) {   
    let result = Object.assign({}, EntryModel);

    result.id = source.id;
    result.name = source.name;
    result.country = source.country;
    result.county = source.county;
    result.region = source.region;
    result.city = source.city;
    result.postalCode = source.postalCode;
    result.latitude = source.latitude;
    result.longitude = source.longitude;
    result.altitude = source.altitude;
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
  convertToOldSearchResult: function(source) {
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
    console.log(source)
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
   * Function that return all data for the search but incomplete, that means only the id and the name
   * @param {*} source : the elasticsearch result
   */
  convertToSearchResult: function(source) {
    let res = {};
    let values = [];
    // For each result of the research, only keep the id and the name then add it to the json to send
    source.hits.hits.forEach((item) => {
      let data = {
        id: item._source.id,
        name: item._source.name,
        type: item._source.type,
        highlights: item.highlight
      };
      values.push(data);
    });

    res.results = values;
    res.totalNbResults = source.hits.total;
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
};
