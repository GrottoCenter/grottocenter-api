const {
  valIfTruthyOrNull,
  getDateFromKarstlink,
  extractUrlFragment,
  getCreator,
} = require('../utils/csvHelper');
const GrottoService = require('./GrottoService');

module.exports = {
  getConvertedDescriptionFromCsv: async (data, authorId) => {
    let descLang =
      valIfTruthyOrNull(data['karstlink:hasDescriptionDocument/dc:language']) ??
      valIfTruthyOrNull(data['dc:language']);

    if (descLang) descLang = descLang.toLowerCase();
    if (descLang && descLang.length === 2) {
      const nameLang = await TLanguage.findOne({ part1: descLang });
      if (nameLang) descLang = nameLang.id;
    }

    return {
      author: authorId,
      title: valIfTruthyOrNull(data['rdfs:label']),
      description: valIfTruthyOrNull(
        data['karstlink:hasDescriptionDocument/dct:description']
      ),
      dateInscription: getDateFromKarstlink(
        valIfTruthyOrNull(data['dct:rights/dct:created']) ?? new Date()
      ),
      dateReviewed: getDateFromKarstlink(
        valIfTruthyOrNull(data['dct:rights/dct:modified']) ?? new Date()
      ),
      language: descLang,
    };
  },

  getConvertedDocumentFromCsv: async (req, data, authorId) => {
    // License
    const licence = extractUrlFragment(
      valIfTruthyOrNull(data['dct:rights/karstlink:licenseType'])
    );
    const licenceDb = await TLicense.findOne({ name: licence });
    if (!licenceDb) {
      throw Error(`This kind of license (${licence}) cannot be imported.`);
    }

    const language = valIfTruthyOrNull(data['dc:language'])?.toLowerCase();
    let nameLang;
    if (language && language.length === 2) {
      nameLang = await TLanguage.findOne({ part1: language });
    }
    const languages = nameLang ? [nameLang.id] : [];

    const country = valIfTruthyOrNull(data['gn:countryCode'])?.toUpperCase();
    let aCountry;
    if (country && country.length === 2) {
      aCountry = await TCountry.findOne({ id: country });
    }
    const countries = aCountry ? [aCountry.id] : [];

    // Creator(s)
    const rawCreators = data['dct:creator'].split('|').filter((e) => e);
    // For each creator, first check if there is a grotto of this name.
    // If not, check for a caver. If not, create a caver.
    const creatorsPromises = rawCreators.map(async (creatorRaw) => {
      const authorGrotto = await TName.findOne({
        name: extractUrlFragment(creatorRaw),
        grotto: { '!=': null },
        isDeleted: false,
      });

      // If a grotto is found, a name object is returned.
      if (authorGrotto) return { type: 'grotto', value: authorGrotto };

      // If it as a caver which is found, it returns a caver object
      return {
        type: 'caver',
        value: await getCreator(creatorRaw),
      };
    });
    const creators = await Promise.all(creatorsPromises);
    const creatorsCaverId = [];
    const creatorsGrottoId = [];

    for (const creator of creators) {
      if (creator.type === 'caver') creatorsCaverId.push(creator.value.id);
      if (creator.type === 'grotto')
        creatorsGrottoId.push(creator.value.grotto);
    }

    // Editor
    let editorId;
    const editorsRaw = valIfTruthyOrNull(data['dct:publisher']);

    if (editorsRaw) {
      const editorName = editorsRaw
        .split('|')
        .map((e) => extractUrlFragment(e).replace(/_/g, ' '))
        .filter((e) => e)
        .join(', ');

      const name = await TName.findOne({
        name: editorName,
        grotto: { '!=': null },
        isDeleted: false,
      });
      if (!name) {
        const paramsGrotto = {
          author: authorId,
          dateInscription: new Date(),
        };
        const nameGrotto = {
          text: editorName,
          language: language ?? 'eng',
          author: authorId,
        };
        const editorGrotto = await GrottoService.createGrotto(
          req,
          paramsGrotto,
          nameGrotto
        );
        editorId = editorGrotto.id;
      } else {
        editorId = name.grotto;
      }
    }

    // Doc type
    let typeId;
    const typeData = valIfTruthyOrNull(data['karstlink:documentType']);
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
    const parentId = valIfTruthyOrNull(data['dct:isPartOf']);
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

    return {
      idDbImport: valIfTruthyOrNull(data.id),
      nameDbImport: valIfTruthyOrNull(data['dct:rights/cc:attributionName']),
      identifier: valIfTruthyOrNull(data['dct:source']),
      identifierType: valIfTruthyOrNull(data['dct:identifier'])
        ?.trim()
        ?.toLowerCase(),

      dateInscription: getDateFromKarstlink(
        valIfTruthyOrNull(data['dct:rights/dct:created']) ?? new Date()
      ),
      dateReviewed: getDateFromKarstlink(
        valIfTruthyOrNull(data['dct:rights/dct:modified']) ?? new Date()
      ),
      datePublication: valIfTruthyOrNull(data['dct:date']),
      // isValidated, // TODO auto validate an imported document ?
      // validationComment: 'From CSV import',

      author: authorId,
      // authorComment: '', // TODO Add ?
      authors: creatorsCaverId,
      authorsGrotto: creatorsGrottoId,
      editor: editorId,
      // library: '', // TODO Add ?

      type: typeId,
      // descriptions is changed independently (getConvertedDescriptionFromCsv)
      subjects: valIfTruthyOrNull(data['dct:subject'])?.split('|'),
      // issue: '', // TODO Add ?
      // pages: '', // TODO Add ?
      // option: '', // TODO Add ?
      license: licenceDb.id,
      languages,

      // TODO Add massifs, cave, entrance, files, authorizationDocument ?
      // TODO Add isoRegions ?
      countries,
      parent: parentId,
    };
  },
};
