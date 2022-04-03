const doubleCheck = sails.helpers.csvhelpers.doubleCheck.with;

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
        key: 'karstlink:hasDescriptionDocument/dc:language',
        func: (value) => value.toLowerCase(),
      }),
      dateInscription: doubleCheckWithData({
        key: 'dct:rights/dct:created',
        defaultValue: new Date(),
      }),
      dateReviewed: doubleCheckWithData({
        key: 'dct:rights/dct:modified',
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

      id_author: idAuthor,
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
      date_inscription: doubleCheckWithData({
        key: 'dct:rights/dct:created',
        defaultValue: new Date(),
      }),
      date_reviewed: doubleCheckWithData({
        key: 'dct:rights/dct:modified',
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
          }),
          dateReviewed: doubleCheckWithData({
            key: 'dct:rights/dct:modified',
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
            key: 'gn:countryCode',
            func: (value) => value.toLowerCase(),
          }),
          dateInscription: doubleCheckWithData({
            key: 'dct:rights/dct:created',
            defaultValue: new Date(),
          }),
          dateReviewed: doubleCheckWithData({
            key: 'dct:rights/dct:modified',
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
        const auth = await sails.helpers.csvhelpers.getCreator.with({
          creator: authorFromCsv,
        });
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
          }),
          dateReviewed: doubleCheckWithData({
            key: 'dct:rights/dct:modified',
            defaultValue: undefined,
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
      }),
      dateReviewed: doubleCheckWithData({
        key: 'dct:rights/dct:modified',
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