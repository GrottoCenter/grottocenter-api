const { getDateFromKarstlink } = require('../../config/constants/karstlink');

const doubleCheck = sails.helpers.csvhelpers.doubleCheck.with;
const { getCreator } = require('../utils/csvHelper');

module.exports = {
  getConvertedNameAndDescCaveFromCsv: (rawData, authorId) => {
    const doubleCheckWithData = (args) =>
      doubleCheck.with({ data: rawData, ...args });

    return {
      author: authorId,
      name: doubleCheckWithData({
        key: 'rdfs:label',
      }),
      language: doubleCheckWithData({
        key: 'rdfs:label/dc:language',
        func: (value) => value.toLowerCase(),
      }),
      dateInscription: doubleCheckWithData({
        key: 'dct:rights/dct:created',
        defaultValue: new Date(),
        func: getDateFromKarstlink,
      }),
      dateReviewed: doubleCheckWithData({
        key: 'dct:rights/dct:modified',
        func: getDateFromKarstlink,
      }),
    };
  },

  getConvertedCaveFromCsv: (rawData, idAuthor) => {
    const doubleCheckWithData = (args) =>
      doubleCheck.with({ data: rawData, ...args });

    let depth = doubleCheckWithData({
      key: 'karstlink:verticalExtend',
    });
    if (!depth) {
      depth =
        parseInt(
          doubleCheckWithData({
            key: 'karstlink:extendBelowEntrance',
            defaultValue: 0,
          }),
          10
        ) +
        parseInt(
          doubleCheckWithData({
            key: 'karstlink:extendAboveEntrance',
            defaultValue: 0,
          }),
          10
        );
    }
    return {
      // The TCave.create() function doesn't work with TCave field alias. See TCave.js Model

      author: idAuthor,
      latitude: doubleCheckWithData({
        key: 'w3geo:latitude',
      }),
      longitude: doubleCheckWithData({
        key: 'w3geo:longitude',
      }),
      length: doubleCheckWithData({
        key: 'karstlink:length',
      }),
      depth,
      dateInscription: doubleCheckWithData({
        key: 'dct:rights/dct:created',
        defaultValue: new Date(),
        func: getDateFromKarstlink,
      }),
      dateReviewed: doubleCheckWithData({
        key: 'dct:rights/dct:modified',
        func: getDateFromKarstlink,
      }),
    };
  },

  getConvertedNameDescLocEntranceFromCsv: async (rawData, authorId) => {
    const doubleCheckWithData = (args) =>
      sails.helpers.csvhelpers.doubleCheck.with({ data: rawData, ...args });
    let result = {};
    if (
      doubleCheckWithData({
        key: 'karstlink:hasDescriptionDocument/dct:title',
      })
    ) {
      result = {
        description: {
          body: doubleCheckWithData({
            key: 'karstlink:hasDescriptionDocument/dct:description',
          }),
          language: doubleCheckWithData({
            key: 'karstlink:hasDescriptionDocument/dc:language',
            func: (value) => value.toLowerCase(),
          }),
          title: doubleCheckWithData({
            key: 'karstlink:hasDescriptionDocument/dct:title',
          }),
          author: authorId,
          dateInscription: doubleCheckWithData({
            key: 'dct:rights/dct:created',
            defaultValue: new Date(),
            func: getDateFromKarstlink,
          }),
          dateReviewed: doubleCheckWithData({
            key: 'dct:rights/dct:modified',
            func: getDateFromKarstlink,
          }),
        },
      };
    }

    if (doubleCheckWithData({ key: 'rdfs:label' })) {
      result = {
        ...result,
        name: {
          author: authorId,
          text: rawData['rdfs:label'],
          language: doubleCheckWithData({
            key: 'rdfs:label/dc:language',
            func: (value) => value.toLowerCase(),
          }),
          dateInscription: doubleCheckWithData({
            key: 'dct:rights/dct:created',
            defaultValue: new Date(),
            func: getDateFromKarstlink,
          }),
          dateReviewed: doubleCheckWithData({
            key: 'dct:rights/dct:modified',
            func: getDateFromKarstlink,
          }),
        },
      };
    }
    if (
      doubleCheckWithData({
        key: 'karstlink:hasAccessDocument/dct:description',
      })
    ) {
      let authorLoc = authorId;
      const authorFromCsv = doubleCheckWithData({
        key: 'karstlink:hasAccessDocument/dct:creator',
      });
      if (authorFromCsv) {
        const auth = await getCreator(authorFromCsv);
        authorLoc = auth.id;
      }
      result = {
        ...result,
        location: {
          body: rawData['karstlink:hasAccessDocument/dct:description'],
          title: doubleCheckWithData({
            key: 'karstlink:hasAccessDocument/dct:description',
          }),
          language: doubleCheckWithData({
            key: 'karstlink:hasAccessDocument/dc:language',
            func: (value) => value.toLowerCase(),
          }),
          author: authorLoc,
          dateInscription: doubleCheckWithData({
            key: 'dct:rights/dct:created',
            defaultValue: new Date(),
            func: getDateFromKarstlink,
          }),
          dateReviewed: doubleCheckWithData({
            key: 'dct:rights/dct:modified',
            defaultValue: undefined,
            func: getDateFromKarstlink,
          }),
        },
      };
    }
    return result;
  },

  getConvertedEntranceFromCsv: (rawData, idAuthor, cave) => {
    const doubleCheckWithData = (args) =>
      doubleCheck.with({ data: rawData, ...args });

    return {
      author: idAuthor,
      country: doubleCheckWithData({
        key: 'gn:countryCode',
      }),
      precision: doubleCheckWithData({
        key: 'dwc:coordinatePrecision',
      }),
      altitude: doubleCheckWithData({
        key: 'w3geo:altitude',
      }),
      latitude: cave.latitude,
      longitude: cave.longitude,
      cave: cave.id,
      dateInscription: doubleCheckWithData({
        key: 'dct:rights/dct:created',
        defaultValue: new Date(),
        func: getDateFromKarstlink,
      }),
      dateReviewed: doubleCheckWithData({
        key: 'dct:rights/dct:modified',
        func: getDateFromKarstlink,
      }),
      isOfInterest: false,
      idDbImport: doubleCheckWithData({
        key: 'id',
      }),
      nameDbImport: doubleCheckWithData({
        key: 'dct:rights/cc:attributionName',
      }),
      // Default value, never provided by csv import
      geology: 'Q35758',
    };
  },
};
