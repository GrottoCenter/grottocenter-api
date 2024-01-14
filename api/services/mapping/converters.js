/* eslint-disable no-underscore-dangle */
const ramda = require('ramda');
const { postgreIntervalObjectToDbString } = require('../CommentService');
const CaveModel = require('./models/CaveModel');
const CaverModel = require('./models/CaverModel');
const DocumentModel = require('./models/DocumentModel');
const EntranceModel = require('./models/EntranceModel');
const EntranceDuplicateModel = require('./models/EntranceDuplicateModel');
const MassifModel = require('./models/MassifModel');
const NotificationModel = require('./models/NotificationModel');
const OrganizationModel = require('./models/OrganizationModel');
const SubjectModel = require('./models/SubjectModel');
const { getMainName, toList, convertIfObject } = require('./utils');
const FileService = require('../FileService');
const RiggingService = require('../RiggingService');
const getQualityData = require('../../utils/computeEntranceDataQuality');

const c = {
  toCave: (source) => ({
    ...CaveModel,
    id: source.id,
    '@id': String(source.id),

    author: convertIfObject(source.author, c.toSimpleCaver),
    reviewer: convertIfObject(source.reviewer, c.toSimpleCaver),
    dateInscription: source.dateInscription,
    dateReviewed: source.dateReviewed,
    name: getMainName(source),
    depth: source.depth,
    length: source.caveLength,
    temperature: source.temperature,
    isDeleted: source.isDeleted,
    isDiving: source.isDiving,

    names: toList('names', source, c.toName),
    descriptions: toList('descriptions', source, c.toSimpleDescription),
    entrances: toList('entrances', source, c.toSimpleEntrance),
    massifs: toList('massifs', source, c.toSimpleMassif),
    documents: toList('documents', source, c.toSimpleDocument),
  }),

  toDeletedCave: (source) => ({
    id: source.id,
    '@id': String(source.id),
    isDeleted: source.isDeleted,
    redirectTo: source.redirectTo,
    author: convertIfObject(source.author, c.toSimpleCaver),
    reviewer: convertIfObject(source.reviewer, c.toSimpleCaver),
    dateInscription: source.dateInscription,
    dateReviewed: source.dateReviewed,
    name: getMainName(source),
  }),

  toSimpleCave: (source) => ({
    id: source.id,
    name: getMainName(source),
    latitude: parseFloat(source.latitude),
    longitude: parseFloat(source.longitude),
    length: source.caveLength,
    depth: source.depth,
    temperature: source.temperature,
    isDiving: source.isDiving,
    entrances: source.entrances?.map((e) => e.id),
  }),

  toCaver: (source) => {
    const result = {
      ...CaverModel,
      id: source.id,
      '@id': String(source.id),
      language: source.language,
      nickname: source.nickname,
      surname: source.surname,
      name: source.name,
      subscribedToCountries: source.subscribedToCountries?.map((e) => e.id),
      subscribedToMassifs: toList(
        'subscribedToMassifs',
        source,
        c.toSimpleMassif
      ),
      // Mail and hashed password should never be returned (RGPD)
    };

    const listParser = (srcField, converterFn, dstField) => {
      if (!source[srcField]) return;
      // eslint-disable-next-line no-param-reassign
      if (!dstField) dstField = srcField;
      if (source[srcField] instanceof Array) {
        result[dstField] = toList(srcField, source, converterFn);
      } else {
        result[dstField] = source[srcField].split(',').map((aId) => ({
          id: parseInt(aId, 10),
        }));
      }
    };

    // Convert collections
    listParser('exploredEntrances', c.toSimpleEntrance);
    listParser('groups', (group) => group);
    listParser('documents', c.toSimpleDocument);
    listParser('grottos', c.toOrganization, 'organizations');

    return result;
  },

  toSimpleCaver: (source) => ({
    id: source.id,
    nickname: source.nickname,
  }),

  toSimpleComment: (source) => {
    const result = {
      id: source.id,
      isDeleted: source.isDeleted,
      language: source.language,
      title: source.title,
      body: source.body,
      dateInscription: source.dateInscription,
      dateReviewed: source.dateReviewed,
      relevance: source.relevance,
      aestheticism: source.aestheticism,
      approach: source.approach,
      caving: source.caving,
      eTTrail: postgreIntervalObjectToDbString(source.eTTrail),
      eTUnderground: postgreIntervalObjectToDbString(source.eTUnderground),
      // alert: source.alert; // TODO ?
      author: convertIfObject(source.author, c.toSimpleCaver),
      reviewer: convertIfObject(source.reviewer, c.toSimpleCaver),
    };
    if (source.t_id) {
      // snapshot
      result.t_id = source.t_id;
    }
    return result;
  },

  toComment: (source) => ({
    ...c.toSimpleComment(source),
    entrance: convertIfObject(source.entrance, c.toSimpleEntrance),
    cave: convertIfObject(source.cave, c.toSimpleCave),
  }),

  toCompleteSearchResult: (source) => {
    // For each result of the search, convert the item and add it to the json to send
    const results = source.hits.hits.map((item) => {
      const type = item._source.tags[0];
      let data = {};

      if (type === 'caver') data = c.toCaver(item._source);
      else if (type === 'document') data = c.toSearchDocument(item._source);
      else if (type === 'entrance') data = c.toEntrance(item._source);
      else if (type === 'grotto') data = c.toOrganization(item._source);
      else if (type === 'language') data = c.toLanguage(item._source);
      else if (type === 'massif') data = c.toMassif(item._source);
      else if (type === 'cave') data = c.toCave(item._source);
      else if (type === 'network') data = c.toCave(item._source);

      return {
        ...data,
        // Add the type and hightlight to the data
        type,
        highlights: item.highlight,
      };
    });

    return {
      results,
      totalNbResults: source.hits.total.value,
    };
  },

  toSimpleDescription: (source) => {
    const result = {
      id: source.id,
      language: source.language,
      title: source.title,
      body: source.body,
      dateInscription: source.dateInscription,
      dateReviewed: source.dateReviewed,
      relevance: source.relevance,
      // point: source.point,
      author: convertIfObject(source.author, c.toSimpleCaver),
      reviewer: convertIfObject(source.reviewer, c.toSimpleCaver),
      isDeleted: source.isDeleted,
    };
    if (source.t_id) {
      // snapshot
      result.t_id = source.t_id;
    }
    return result;
  },

  toDescription: (source) => ({
    ...c.toSimpleDescription(source),
    entrance: convertIfObject(source.entrance, c.toSimpleEntrance),
    massif: convertIfObject(source.massif, c.toSimpleMassif),
    cave: convertIfObject(source.cave, c.toSimpleCave),
  }),

  toDocumentDescriptions: (sources) => {
    if (!sources) return {};
    const descs = sources.filter((e) => !e.isDeleted);
    if (!descs || descs.length === 0) return {};
    return {
      title: descs[0].title,
      description: descs[0].body,
    };
  },

  toSimpleDocument: (source) => ({
    id: source.id,
    type: source.type?.name,
    ...c.toDocumentDescriptions(source.descriptions),
    files: toList('files', source, c.toFile),
    dateInscription: source.dateInscription,
    dateReviewed: source.dateReviewed,
    datePublication: source.datePublication,
    isValidated: source.isValidated,
    isDeleted: source.isDeleted,
  }),

  // There is 2 source format
  // - From logstash
  // - From
  toSearchDocument: (source) => {
    const result = {
      ...DocumentModel,
      id: source.id,
      importId: source.idDbImport ?? undefined,
      importSource: source.nameDbImport?.trim(),
      identifierType:
        source.id_identifier_type?.trim() ?? source.identifierType?.id?.trim(),
      identifier: source.identifier ?? undefined,

      datePublication: source.date_publication,
      isDeleted: source.deleted,

      creator: {
        id: source['contributor id'],
        nickname: source['contributor nickname'],
      },
      authors: source.authors, // A string of nicknames separated by '; '
      editor: {
        id: source['editor id'],
        name: source['editor name'],
      },
      library: {
        id: source['library id'],
        name: source['library name'],
      },
      documentType: source['type name'],
      title: source.title,
      description: source.description,
      subjects: source.subjects,
      issue: source.issue,

      iso3166: [
        ...(source.iso_regions?.split(', ') ?? []),
        ...(source.countries?.split(', ') ?? []),
      ],
    };
    return result;
  },

  toDocument: (source) => {
    const result = {
      ...DocumentModel,
      id: source.id,
      '@id': String(source.id),
      importId: source.idDbImport ?? undefined,
      importSource: source.nameDbImport?.trim(),
      identifierType: source.identifierType?.id?.trim(),
      identifier: source.identifier ?? undefined,

      dateInscription: source.dateInscription,
      dateReviewed: source.dateReviewed,
      dateValidation: source.dateValidation,
      datePublication: source.datePublication,
      isDeleted: source.isDeleted,
      redirectTo: source.redirectTo,
      isValidated: source.isValidated,

      creator: convertIfObject(source.author, c.toSimpleCaver),
      creatorComment: source.authorComment,
      authors: toList('authors', source, c.toSimpleCaver),
      authorsOrganization: toList(
        'authorsGrotto',
        source,
        c.toSimpleOrganization
      ),
      reviewer: convertIfObject(source.reviewer, c.toSimpleCaver),
      validator: convertIfObject(source.validator, c.toSimpleCaver),
      validatorComment: source.validationComment,
      editor: convertIfObject(source.editor, c.toSimpleOrganization),
      library: convertIfObject(source.library, c.toSimpleOrganization),
      type: source.type?.name,
      ...c.toDocumentDescriptions(source.descriptions),
      subjects: source.subjects,
      issue: source.issue,
      pages: source.pages,
      license: source.license?.name,
      option: source.option?.name,
      mainLanguage: source.mainLanguage?.id ?? source.languages?.[0]?.id,
      languages: source.languages?.map((e) => e.id),

      iso3166: [
        ...(source.countries?.map((e) => ({ iso: e.id, name: e.nativeName })) ??
          []),
        ...(source.isoRegions?.map((e) => ({ iso: e.id, name: e.name })) ?? []),
      ],
      entrance: convertIfObject(source.entrance, c.toSimpleEntrance),
      cave: convertIfObject(source.cave, c.toSimpleCave),
      massifs: toList('massifs', source, c.toSimpleMassif),
      parent: convertIfObject(source.parent, c.toSimpleDocument),
      files: toList('files', source, c.toFile),
      authorizationDocument: convertIfObject(
        source.authorizationDocument,
        c.toSimpleDocument
      ),

      oldBBS: {
        pages: source.pagesBBSOld,
        comments: source.commentsBBSOld,
        publicationOther: source.publicationOtherBBSOld,
        publicationFascicule: source.publicationFasciculeBBSOld,
      },

      // Only present when it is a modified document
      modifiedFiles: source.modifiedFiles,
      newFiles: source.newFiles,
      deletedFiles: source.deletedFiles,
    };

    // snapshot
    if (source.t_id) result.t_id = source.t_id;

    return result;
  },

  toDeletedDocument: (source) => ({
    id: source.id,
    '@id': String(source.id),
    isDeleted: source.isDeleted,
    redirectTo: source.redirectTo,
    dateInscription: source.dateInscription,
    dateReviewed: source.dateReviewed,
    author: convertIfObject(source.author, c.toSimpleCaver),
    reviewer: convertIfObject(source.reviewer, c.toSimpleCaver),
  }),

  toDocumentDuplicate: (source) => ({
    id: source.id,
    datePublication: source.datePublication,
    author: convertIfObject(source.author, c.toSimpleCaver),
    document: convertIfObject(source.document, c.toDocument),
    content: convertIfObject(source.content, c.toDocument),
  }),

  toSimpleDocumentDuplicate: (source) => ({
    id: source.id,
    datePublication: source.datePublication,
    author: convertIfObject(source.author, c.toSimpleCaver),
    document: convertIfObject(source.document, c.toSimpleDocument),
    content: source.content, // TODO is this ok ? (format: {document, description} instead of a document object)
  }),

  toEntrance: (source) => {
    const result = {
      ...EntranceModel,
    };
    result['@id'] = String(source.id);
    result.id = source.id;
    if (source.t_id) {
      // snapshot
      result.t_id = source.t_id;
    }
    result.isDeleted = source.isDeleted;
    result.isSensitive = source.isSensitive;
    result.redirectTo = source.redirectTo;
    result.aestheticism = source.aestheticism;
    result.altitude = source.altitude;
    result.approach = source.approach;
    result.caving = source.caving;
    result.dateInscription = source.dateInscription;
    result.dateReviewed = source.dateReviewed;
    result.discoveryYear = source.yearDiscovery;
    result.externalUrl = source.externalUrl;
    result.latitude = source.isSensitive ? null : parseFloat(source.latitude);
    result.longitude = source.isSensitive ? null : parseFloat(source.longitude);
    result.name = getMainName(source);
    result.country = source.country;
    result.countryCode = source['country code'];
    result.region = source.region;
    result.county = source.county;
    result.city = source.city;
    result.iso_3166_2 = source.iso_3166_2;
    result.precision = source.precision;
    result.stats = source.stats;
    result.timeInfo = source.timeInfo; // Only used in random entrance
    // Convert objects
    if (source['cave name']) {
      // Elasticsearch
      result.cave = {
        depth: source['cave depth'],
        length: source['cave length'],
        name: source['cave name'],
        isDiving: source['cave is diving'],
      };
    } else if (source.cave instanceof Object) {
      result.cave = c.toSimpleCave(source.cave);
    } else {
      result.cave = source.cave;
    }
    // Once cave is populated, put the massifs at the root of the entrance
    // (more convenient for the client)
    result.massifs = toList('massifs', source.cave ?? {}, c.toSimpleMassif);
    result.author = convertIfObject(source.author, c.toSimpleCaver);
    result.reviewer = convertIfObject(source.reviewer, c.toSimpleCaver);
    // Convert collections
    result.names = toList('names', source, c.toName);
    result.descriptions = toList('descriptions', source, c.toSimpleDescription);
    result.comments = toList('comments', source, c.toSimpleComment);
    result.documents = toList('documents', source, c.toSimpleDocument);
    result.histories = toList('histories', source, c.toSimpleHistory);
    result.locations = source.isSensitive
      ? []
      : toList('locations', source, c.toSimpleLocation);
    result.riggings = toList('riggings', source, c.toSimpleRigging);
    // Massif from Elasticsearch
    if (source['massif name']) {
      result.massifs = {
        name: source['massif name'],
      };
    }
    return result;
  },

  toDeletedEntrance: (source) => ({
    id: source.id,
    '@id': String(source.id),
    isDeleted: source.isDeleted,
    isSensitive: source.isSensitive,
    redirectTo: source.redirectTo,
    author: convertIfObject(source.author, c.toSimpleCaver),
    reviewer: convertIfObject(source.reviewer, c.toSimpleCaver),
    dateInscription: source.dateInscription,
    dateReviewed: source.dateReviewed,
    name: getMainName(source),
    country: source.country,
    region: source.region,
    county: source.county,
    city: source.city,
    iso_3166_2: source.iso_3166_2,
  }),

  toSimpleEntrance: (source) => ({
    id: source.id,
    name: getMainName(source),
    country: source.country,
    region: source.region,
    county: source.county,
    city: source.city,
    iso_3166_2: source.iso_3166_2,
    latitude: source.isSensitive ? null : parseFloat(source.latitude),
    longitude: source.isSensitive ? null : parseFloat(source.longitude),
    isSensitive: source.isSensitive,
    isDeleted: source.isDeleted,
  }),

  toEntranceDuplicate: (source) => {
    const result = {
      ...EntranceDuplicateModel,
    };

    result.id = source.id;
    result.content = source.content;
    result.datePublication = source.datePublication;

    // Convert objects
    const { toCaver, toEntrance } = module.exports;
    result.author =
      source.author instanceof Object ? toCaver(source.author) : source.author;
    result.entrance =
      source.entrance instanceof Object
        ? toEntrance(source.entrance)
        : source.entrance;

    return result;
  },

  toFile: (source) => ({
    dateInscription: source.dateInscription,
    isValidated: source.isValidated,
    fileName: source.fileName,
    completePath: FileService.document.getUrl(source.path),
  }),

  toSimpleHistory: (source) => {
    const result = {
      id: source.id,
      body: source.body,
      dateInscription: source.dateInscription,
      dateReviewed: source.dateReviewed,
      relevance: source.relevance,
      language: source.language,
      isDeleted: source.isDeleted,
      author: convertIfObject(source.author, c.toSimpleCaver),
      reviewer: convertIfObject(source.reviewer, c.toSimpleCaver),
    };
    if (source.t_id) {
      // snapshot
      result.t_id = source.t_id;
    }
    return result;
  },

  toHistory: (source) => ({
    ...c.toSimpleHistory(source),
    entrance: convertIfObject(source.entrance, c.toSimpleEntrance),
    cave: convertIfObject(source.cave, c.toSimpleCave),
  }),

  toLanguage: (source) => ({
    id: source.id,
    comment: source.comment,
    isPrefered: source.isPrefered,
    part2b: source.part2b,
    part2t: source.part2t,
    part1: source.part1,
    refName: source.refName,
    scope: source.scope,
    type: source.type,
  }),

  toSimpleLocation: (source) => {
    const result = {
      id: source.id,
      body: source.body,
      dateInscription: source.dateInscription,
      dateReviewed: source.dateReviewed,
      language: source.language,
      relevance: source.relevance,
      title: source.title,
      isDeleted: source.isDeleted,
      author: convertIfObject(source.author, c.toSimpleCaver),
      reviewer: convertIfObject(source.reviewer, c.toSimpleCaver),
    };
    if (source.t_id) {
      // snapshot
      result.t_id = source.t_id;
    }
    return result;
  },

  toLocation: (source) => ({
    ...c.toSimpleLocation(source),
    entrance: convertIfObject(source.entrance, c.toSimpleEntrance),
    massif: convertIfObject(source.massif, c.toSimpleMassif),
    cave: convertIfObject(source.cave, c.toSimpleCave),
  }),

  toMassif: (source) => ({
    ...MassifModel,
    id: source.id,
    '@id': String(source.id),
    isDeleted: source.isDeleted,
    author: convertIfObject(source.author, c.toSimpleCaver),
    reviewer: convertIfObject(source.reviewer, c.toSimpleCaver),
    dateInscription: source.dateInscription,
    dateReviewed: source.dateReviewed,
    name: getMainName(source),
    geogPolygon: source.geoJson,
    nbCaves: source['nb caves'], // from Elasticsearch
    nbEntrances: source['nb entrances'], // from Elasticsearch
    descriptions: toList('descriptions', source, c.toSimpleDescription),
    entrances: toList('entrances', source, c.toSimpleEntrance),
    documents: toList('documents', source, c.toSimpleDocument),
    networks: toList('networks', source, c.toSimpleCave),
  }),

  toDeletedMassif: (source) => ({
    id: source.id,
    '@id': String(source.id),
    isDeleted: source.isDeleted,
    redirectTo: source.redirectTo,
    author: convertIfObject(source.author, c.toSimpleCaver),
    reviewer: convertIfObject(source.reviewer, c.toSimpleCaver),
    dateInscription: source.dateInscription,
    dateReviewed: source.dateReviewed,
    name: getMainName(source),
  }),

  toSimpleMassif: (source) => ({
    id: source.id,
    name: getMainName(source),
    isDeleted: source.isDeleted,
  }),

  toName: (source) => ({
    id: source.id,
    name: source.name,
    isMain: source.isMain,
    language: source.language,
    dateInscription: source.dateInscription,
    dateReviewed: source.dateReviewed,
    isDeleted: source.isDeleted,
    author: convertIfObject(source.author, c.toSimpleCaver),
    reviewer: convertIfObject(source.reviewer, c.toSimpleCaver),
  }),

  toNotification: (source) => {
    const result = {
      ...NotificationModel,
    };
    result.id = source.id;
    result.dateInscription = source.dateInscription;
    result.dateReadAt = source.dateReadAt;
    result.notificationType = source.notificationType;
    result.notified = source.notified;
    result.notifier = source.notifier;

    // Convert objects
    result.cave = convertIfObject(source.cave, c.toCave);
    result.comment = convertIfObject(source.comment, c.toComment);
    result.description = convertIfObject(source.description, c.toDescription);
    result.document = convertIfObject(source.document, c.toSimpleDocument);
    result.entrance = convertIfObject(source.entrance, c.toEntrance);
    result.history = convertIfObject(source.history, c.toHistory);
    result.location = convertIfObject(source.location, c.toLocation);
    result.massif = convertIfObject(source.massif, c.toMassif);
    result.notified = convertIfObject(source.notified, c.toCaver);
    result.notifier = convertIfObject(source.notifier, c.toCaver);
    result.organization = convertIfObject(source.grotto, c.toOrganization);
    result.rigging = convertIfObject(source.rigging, c.toRigging);
    return result;
  },

  toSimpleOrganization: (source) => ({
    id: source.id,
    name: getMainName(source),
    isDeleted: source.isDeleted,
  }),

  toOrganization: (source) => ({
    ...OrganizationModel,
    id: source.id,
    '@id': String(source.id),
    isDeleted: source.isDeleted,
    dateInscription: source.dateInscription,
    dateReviewed: source.dateReviewed,
    author: convertIfObject(source.author, c.toSimpleCaver),
    reviewer: convertIfObject(source.reviewer, c.toSimpleCaver),
    name: getMainName(source),
    latitude: parseFloat(source.latitude),
    longitude: parseFloat(source.longitude),
    country: source.country,
    countryCode: source['country code'],
    region: source.region,
    county: source.county,
    city: source.city,
    address: source.address,
    postalCode: source.postalCode,
    iso_3166_2: source.iso_3166_2,
    mail: source.mail,
    url: source.url,
    customMessage: source.customMessage,
    isOfficialPartner: source.isOfficialPartner,
    pictureFileName: source.pictureFileName,
    yearBirth: source.yearBirth,
    nbCavers: source['nb cavers'], // from Elasticsearch
    cavers: toList('cavers', source, c.toSimpleCaver),
    documents: toList('documents', source, c.toSimpleDocument),
    exploredEntrances: toList('exploredEntrances', source, c.toSimpleEntrance),
    exploredNetworks: toList('exploredNetworks', source, c.toSimpleCave),
    partnerEntrances: toList('partnerEntrances', source, c.toSimpleEntrance),
    partnerNetworks: toList('partnerNetworks', source, c.toSimpleCave),
  }),

  toDeletedOrganization: (source) => ({
    id: source.id,
    '@id': String(source.id),
    isDeleted: source.isDeleted,
    redirectTo: source.redirectTo,
    author: convertIfObject(source.author, c.toSimpleCaver),
    reviewer: convertIfObject(source.reviewer, c.toSimpleCaver),
    dateInscription: source.dateInscription,
    dateReviewed: source.dateReviewed,
    name: getMainName(source),
    country: source.country,
    region: source.region,
    county: source.county,
    city: source.city,
    iso_3166_2: source.iso_3166_2,
  }),

  toSimpleRigging: (source) => {
    const result = {
      id: source.id,
      isDeleted: source.isDeleted,
      title: source.title,
      language: source.language,
      dateInscription: source.dateInscription,
      dateReviewed: source.dateReviewed,
      relevance: source.relevance,
      obstacles: RiggingService.deserializeForAPI(source),
      author: convertIfObject(source.author, c.toSimpleCaver),
      reviewer: convertIfObject(source.reviewer, c.toSimpleCaver),
    };
    if (source.t_id) {
      // snapshot
      result.t_id = source.t_id;
    }
    return result;
  },

  toRigging: (source) => ({
    ...c.toSimpleRigging(source),
    entrance: convertIfObject(source.entrance, c.toSimpleEntrance),
    cave: convertIfObject(source.cave, c.toSimpleCave),
  }),

  toSearchResult: (source) => {
    const res = {};
    const values = [];

    if (source.hits) {
      source.hits.hits.forEach((item) => {
        // Common data
        const data = {
          id: item._id,
          name: item._source.name ? item._source.name : item._source.title, // Handle title for documents (instead of name)
          type: item._source.tags[0],
          highlights: item.highlight,
        };

        if (item._source.longitude) {
          data.longitude = parseFloat(item._source.longitude);
        }
        if (item._source.latitude) {
          data.latitude = parseFloat(item._source.latitude);
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

        switch (item._source.tags[0]) {
          case 'entrance':
            data.cave = {
              id: item._source.id_cave,
              name: item._source['cave name'],
              depth: item._source['cave depth'],
              length: item._source['cave length'],
            };
            data.city = item._source.city;
            data.county = item._source.county;
            data.region = item._source.region;
            data.names = item._source.names;
            data.descriptions = item._source.descriptions;
            break;

          case 'grotto':
            data.names = item._source.names;
            data.address = item._source.address;
            break;

          case 'massif':
            data.names = item._source.names;
            data.descriptions = item._source.descriptions;
            break;

          case 'document':
          case 'document-collection':
          case 'document-issue':
            // Rename keys of source and highlights
            // 08/2020 - C. ROIG - Not needed at the moment but keep in case
            // renameKeys(item['_source'], replacementKeys);
            // renameKeys(data.highlights, replacementKeys);

            // Fill data with appropriate keys
            Object.keys(item._source).forEach((key) => {
              data[key] = item._source[key];
            });

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
            data.surname = item._source.surname;
            data.nickname = item._source.nickname;
            // Don't return mail (RGPD)
            // data.mail = item['_source'].mail;
            break;

          case 'language':
            data.refName = item._source.ref_name;
            data.isPrefered = item._source.is_prefered;
            data.part1 = item._source.part1;
            data.part2b = item._source.part2b;
            data.part2t = item._source.part2t;
            data.scope = item._source.scope;
            break;

          case 'cave':
          case 'network':
            data.depth = item._source.depth;
            data.descriptions = item._source.descriptions;
            data.isDiving = item._source.is_diving;
            data.length = item._source.length;
            data.names = item._source.names;
            data.sizeCoef = item._source.size_coef;
            data.temperature = item._source.temperature;
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

  toSubject: (source) => {
    const result = {
      ...SubjectModel,
    };
    result.code = source.id.trim(); // there are some spaces at the end of the id in the DB
    result.subject = source.subject;
    result.parent =
      source.parent && source.parent.id && source.parent.subject
        ? module.exports.toSubject(source.parent)
        : source.parent;
    return result;
  },

  toQualityDataEntrance: (entrance) => ({
    name: entrance.entrance_name,
    massif_name: entrance.massif_name,
    id_entrance: entrance.id_entrance,
    id_country: entrance.id_country,
    country_name: entrance.country_name,
    data_quality: getQualityData(entrance),
    date_of_update: entrance.date_of_update,
  }),
};

module.exports = c;
