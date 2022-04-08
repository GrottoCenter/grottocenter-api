const { doubleCheck } = sails.helpers.csvhelpers;
const { getDateFromKarstlink } = require('../../config/constants/karstlink');
const GrottoService = require('./GrottoService');

module.exports = {
  getConvertedLangDescDocumentFromCsv: (rawData, authorId) => {
    const doubleCheckWithData = (args) =>
      doubleCheck.with({ data: rawData, ...args });

    const description = doubleCheckWithData({
      key: 'karstlink:hasDescriptionDocument/dct:description',
    });
    const langDesc = description
      ? doubleCheckWithData({
          key: 'karstlink:hasDescriptionDocument/dc:language',
          func: (value) => value.toLowerCase(),
        })
      : doubleCheckWithData({
          key: 'dc:language',
          func: (value) => value.toLowerCase(),
        });
    return {
      author: authorId,
      title: doubleCheckWithData({
        key: 'rdfs:label',
      }),
      description,
      dateInscription: doubleCheckWithData({
        key: 'dct:rights/dct:created',
        defaultValue: new Date(),
        func: getDateFromKarstlink,
      }),
      dateReviewed: doubleCheckWithData({
        key: 'dct:rights/dct:modified',
        func: getDateFromKarstlink,
      }),
      documentMainLanguage: {
        id: doubleCheckWithData({
          key: 'dc:language',
          func: (value) => value.toLowerCase(),
        }),
      },
      titleAndDescriptionLanguage: {
        id: langDesc,
      },
    };
  },

  getConvertedDocumentFromCsv: async (rawData, authorId) => {
    const doubleCheckWithData = (args) =>
      doubleCheck.with({ data: rawData, ...args });
    const retrieveFromLink = sails.helpers.csvhelpers.retrieveFromLink.with;

    // License
    const rawLicence = doubleCheckWithData({
      key: 'dct:rights/karstlink:licenseType',
    });
    const licence = await retrieveFromLink({ stringArg: rawLicence });
    const licenceDb = await TLicense.findOne({ name: licence });
    if (!licenceDb) {
      throw Error(`This kind of license (${licence}) cannot be imported.`);
    }

    // Creator(s)
    const rawCreators = rawData['dct:creator'].split('|');
    const checkedRawCreators = rawCreators[0] === '' ? [] : rawCreators; // Empty the first array value if it's an empty string to avoid iterating through it
    // For each creator, first check if there is a grotto of this name.
    // If not, check for a caver. If not, create a caver.
    const creatorsPromises = checkedRawCreators.map(async (creatorRaw) => {
      const authorGrotto = await TName.find({
        name: await retrieveFromLink({ stringArg: creatorRaw }),
        grotto: { '!=': null },
      }).limit(1);
      // If a grotto is found, a name object is returned.
      // If it as a caver which is found, it returns a caver object
      if (authorGrotto.length === 0) {
        return {
          type: 'caver',
          value: await sails.helpers.csvhelpers.getCreator.with({
            creator: creatorRaw,
          }),
        };
      }
      return { type: 'grotto', value: authorGrotto[0] };
    });
    const creators = await Promise.all(creatorsPromises);

    // Editor
    const editorsRaw = doubleCheckWithData({
      key: 'dct:publisher',
      defaultValue: null,
    });
    let editorId;
    if (editorsRaw) {
      const editorsRawArray = editorsRaw.split('|');
      let editorName = '';
      for (const editorRaw of editorsRawArray) {
        // eslint-disable-next-line no-await-in-loop
        const editorNameRaw = await retrieveFromLink({ stringArg: editorRaw });
        editorName += `${editorNameRaw.replace('_', ' ')}, `;
      }
      editorName = editorName.slice(0, -2);
      const namesArray = await TName.find({
        name: editorName,
        grotto: { '!=': null },
      }).limit(1);
      if (namesArray.length === 0) {
        const paramsGrotto = {
          author: authorId,
          dateInscription: new Date(),
        };
        const nameGrotto = {
          text: editorName,
          language: doubleCheckWithData({
            key: 'dc:language',
            defaultValue: 'eng',
            func: (value) => value.toLowerCase(),
          }),
          author: authorId,
        };
        const editorGrotto = await GrottoService.createGrotto(
          paramsGrotto,
          nameGrotto
        );
        editorId = editorGrotto.id;
      } else {
        const name = namesArray[0];
        editorId = name.grotto;
      }
    }

    // Doc type
    const typeData = doubleCheckWithData({
      key: 'karstlink:documentType',
    });
    let typeId;
    if (typeData) {
      const typeCriteria = typeData.startsWith('http')
        ? { url: typeData }
        : { name: typeData };
      const type = await TType.findOne(typeCriteria);
      if (!type) {
        throw Error(`The document type '${typeData}' is incorrect.`);
      }
      typeId = type.id;
    }

    // Parent / partOf
    const parentId = doubleCheckWithData({
      key: 'dct:isPartOf',
    });
    const doesParentExist = parentId
      ? await sails.helpers.checkIfExists.with({
          attributeName: 'id',
          attributeValue: parentId,
          sailsModel: TDocument,
        })
      : false;
    if (parentId && !doesParentExist) {
      throw Error(`Document parent with id ${parentId} not found.`);
    }

    // Subjects
    const subjectsData = doubleCheckWithData({
      key: 'dct:subject',
    });
    const subjects = subjectsData ? subjectsData.split('|') : undefined;

    const creatorsCaverId = [];
    const creatorsGrottoId = [];
    for (const creator of creators) {
      switch (creator.type) {
        case 'caver':
          creatorsCaverId.push(creator.value.id);
          break;
        case 'grotto':
          creatorsGrottoId.push(creator.value.grotto);
          break;
        default:
          break;
      }
    }

    return {
      author: authorId,
      authors: creatorsCaverId,
      authorsGrotto: creatorsGrottoId,
      dateInscription: doubleCheckWithData({
        key: 'dct:rights/dct:created',
        defaultValue: new Date(),
        func: getDateFromKarstlink,
      }),
      datePublication: doubleCheckWithData({
        key: 'dct:date',
      }),
      dateReviewed: doubleCheckWithData({
        key: 'dct:rights/dct:modified',
        func: getDateFromKarstlink,
      }),
      editor: editorId,
      idDbImport: doubleCheckWithData({
        key: 'id',
      }),
      identifier: doubleCheckWithData({
        key: 'dct:source',
      }),
      identifierType: doubleCheckWithData({
        key: 'dct:identifier',
        func: (value) => value.trim().toLowerCase(),
      }),
      license: licenceDb.id,
      nameDbImport: doubleCheckWithData({
        key: 'dct:rights/cc:attributionName',
      }),
      parent: parentId,
      subjects,
      type: typeId,
    };
  },
};
