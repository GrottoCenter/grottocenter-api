/* eslint-disable no-underscore-dangle */
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
const GuidelineModel = require('./models/GuidelineModel');
const {
  getMainName,
  getMainLanguage,
  toList,
  convertIfObject,
} = require('./utils');
const FileService = require('../FileService');
const RiggingService = require('../RiggingService');
const {
  getQualityData,
  getQualityBreakdown,
} = require('../../utils/computeEntranceDataQuality');

const c = {
  toCave: (source, meta) => {
    const result = {
      ...CaveModel,
      id: source.id,
      '@id': String(source.id),

      author: convertIfObject(source.author, c.toSimpleCaver),
      reviewer: convertIfObject(source.reviewer, c.toSimpleCaver),
      dateInscription: source.dateInscription,
      dateReviewed: source.dateReviewed,
      name: getMainName(source),
      language: getMainLanguage(source),
      depth: source.depth,
      length: source.caveLength ?? source.length ?? null,
      temperature: source.temperature,
      isDeleted: source.isDeleted,
      redirectTo: source.redirectTo,
      isDiving: source.isDiving,

      names: toList('names', source, c.toName),
      descriptions: toList('descriptions', source, c.toSimpleDescription, {
        filterDeleted: false,
      }),
      entrances: toList('entrances', source, c.toSimpleEntrance, { meta }),
      massifs: toList('massifs', source, c.toSimpleMassif),
      documents: toList('documents', source, c.toCitationDocument),
      exploringOrganizations: toList(
        'exploringOrganizations',
        source,
        c.toSimpleOrganization
      ),
    };

    // Caves only carry massif-level guidelines. source.guidelines is the
    // grouped object from getGuidelinesForCave ({ massif: [...] }), read the
    // same way the entrance converter reads its country/region/massif groups.
    const massifList = toList(
      'massif',
      source.guidelines || {},
      c.toSimpleGuideline
    );
    result.guidelines = massifList.length === 0 ? [] : { massif: massifList };

    return result;
  },

  toSimpleCave: (source) => ({
    id: source.id,
    name: getMainName(source),
    language: getMainLanguage(source),
    length: source.caveLength ?? source.length ?? null,
    depth: source.depth,
    temperature: source.temperature,
    isDiving: source.isDiving,
    nbEntrances: source.nbEntrances ?? source.entrances?.length ?? 0,
    entrances: source.entrances
      ?.map((e) => e?.id ?? e)
      .filter((e) => e != null),
  }),

  toCaver: (source, meta) => {
    const result = {
      ...CaverModel,
      id: source.id,
      '@id': String(source.id),
      type: source.type,
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
    listParser('documents', c.toCitationDocument);
    listParser('grottos', c.toSimpleOrganization, 'organizations');

    if (meta?.isAdmin) {
      result.isBanned = Boolean(source.banned);
    }

    return result;
  },

  toSimpleCaver: (source) => ({
    id: source.id,
    nickname: source.nickname,
  }),

  toListCaver: (source) => ({
    id: source.id,
    nickname: source.nickname,
    name: source.name,
    surname: source.surname,
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

  toComment: (source, meta) => ({
    ...c.toSimpleComment(source),
    entrance: convertIfObject(source.entrance, c.toSimpleEntrance, { meta }),
    cave: convertIfObject(source.cave, c.toSimpleCave),
  }),

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

  toDescription: (source, meta) => ({
    ...c.toSimpleDescription(source),
    entrance: convertIfObject(source.entrance, c.toSimpleEntrance, { meta }),
    massif: convertIfObject(source.massif, c.toSimpleMassif),
    cave: convertIfObject(source.cave, c.toSimpleCave),
  }),

  toDocumentDescriptions: (sources) => {
    if (!Array.isArray(sources)) return {};
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
    title: source.title, // From search
    description: source.description, // From search
    ...c.toDocumentDescriptions(source.descriptions), // From DB
    files: toList('files', source, c.toFile),
    dateInscription: source.dateInscription,
    dateReviewed: source.dateReviewed,
    datePublication: source.datePublication,
    isValidated: source.isValidated,
    isDeleted: source.isDeleted,
  }),

  // An ancestor in a citation's parent chain, kept far lighter than a document:
  // a reference only needs what identifies the parent publication.
  //
  // The chain is walked rather than flattened to a single title because an
  // ISO 690 article reference spans two levels — the Issue supplies the number
  // and the publication date, the Collection above it supplies the journal
  // name — and those two titles are distinct. The chain is bounded by
  // TYPES_ALLOWING_PARENT (Article → Issue → Collection), so this cannot
  // recurse indefinitely; DocumentService caps the depth when resolving it.
  toCitationParent: (source) => ({
    id: source.id,
    type: source.type?.name,
    title: c.toDocumentDescriptions(source.descriptions).title,
    issue: source.issue,
    datePublication: source.datePublication,
    parent: convertIfObject(source.parent, c.toCitationParent),
  }),

  // A simple document plus the bibliographic fields a document card needs to
  // display a full citation. Only for sources coming from
  // DocumentService.getDocumentsForCitation(): the other ones have those
  // associations unpopulated, and must stick to toSimpleDocument.
  toCitationDocument: (source) => ({
    ...c.toSimpleDocument(source),
    authors: toList('authors', source, c.toSimpleCaver),
    authorsOrganization: toList(
      'authorsOrganization',
      source,
      c.toSimpleOrganization
    ),
    editor: convertIfObject(source.editor, c.toSimpleOrganization),
    library: convertIfObject(source.library, c.toSimpleOrganization),
    identifier: source.identifier ?? undefined,
    identifierType: source.identifierType?.id?.trim(),
    issue: source.issue,
    pages: source.pages,
    parent: convertIfObject(source.parent, c.toCitationParent),
    oldBBS: {
      pages: source.pagesBBSOld,
      comments: source.commentsBBSOld,
      publicationOther: source.publicationOtherBBSOld,
      publicationFascicule: source.publicationFasciculeBBSOld,
    },
  }),

  toDocument: (source, meta) => {
    const result = {
      ...DocumentModel,
      id: source.id,
      '@id': String(source.id),
      importId: source.idDbImport ?? source.importId ?? undefined,
      importSource: source.nameDbImport?.trim() ?? source.importSource,
      identifierType: source.identifierType?.id?.trim(),
      identifier: source.identifier ?? undefined,

      dateInscription: source.dateInscription,
      dateReviewed: source.dateReviewed,
      dateValidation: source.dateValidation,
      datePublication: source.datePublication,
      isDeleted: source.isDeleted,
      redirectTo: source.redirectTo,
      isValidated: source.isValidated,

      creator:
        convertIfObject(source.author, c.toSimpleCaver) ?? source.creator,
      creatorComment: source.authorComment ?? source.creatorComment ?? null,
      authors: toList('authors', source, c.toSimpleCaver),
      authorsOrganization: toList(
        'authorsOrganization',
        source,
        c.toSimpleOrganization
      ),
      reviewer: convertIfObject(source.reviewer, c.toSimpleCaver),
      validator: convertIfObject(source.validator, c.toSimpleCaver),
      validatorComment: source.validationComment,
      editor: convertIfObject(source.editor, c.toSimpleOrganization),
      library: convertIfObject(source.library, c.toSimpleOrganization),
      type: source.type?.name ?? source.type,
      title: source.title, // From search
      description: source.description, // From search
      ...c.toDocumentDescriptions(source.descriptions), // From DB
      subjects: source.subjects,
      issue: source.issue,
      pages: source.pages,
      license: source.license?.name ?? source.license,
      option: source.option?.name,
      mainLanguage: source.mainLanguage?.id ?? source.languages?.[0]?.id,
      languages: source.languages?.map((e) => e.id),
      // language: from Typesense flat field, or derived from DB mainLanguage/languages
      language:
        source.language ??
        source.mainLanguage?.id ??
        source.languages?.[0]?.id ??
        null,

      iso3166: source.iso3166 ?? [
        ...(source.countries?.map((e) => ({ iso: e.id, name: e.nativeName })) ??
          []),
        ...(source.isoRegions?.map((e) => ({ iso: e.id, name: e.name })) ?? []),
      ],
      parent: convertIfObject(source.parent, c.toSimpleDocument),
      files: toList('files', source, c.toFile),
      authorizationDocument: convertIfObject(
        source.authorizationDocument,
        c.toSimpleDocument
      ),
      entrances: toList('entrances', source, c.toSimpleEntrance, { meta }),
      cave: convertIfObject(source.cave, c.toSimpleCave),
      massifs: toList('massifs', source, c.toSimpleMassif),

      oldBBS: {
        pages: source.pagesBBSOld,
        comments: source.commentsBBSOld,
        publicationOther: source.publicationOtherBBSOld,
        publicationFascicule: source.publicationFasciculeBBSOld,
      },

      // Only present when it is a modified document
      newFiles: toList('newFiles', source, c.toFile),
      modifiedFiles: toList('modifiedFiles', source, c.toFile),
      deletedFiles: toList('deletedFiles', source, c.toFile),
    };

    // snapshot
    if (source.t_id) result.t_id = source.t_id;

    return result;
  },

  toDocumentDuplicate: (source, meta) => ({
    id: source.id,
    datePublication: source.datePublication,
    author: convertIfObject(source.author, c.toSimpleCaver),
    document: convertIfObject(source.document, c.toDocument, { meta }),
    content: convertIfObject(source.content, c.toDocument, { meta }),
  }),

  toSimpleDocumentDuplicate: (source) => ({
    id: source.id,
    datePublication: source.datePublication,
    author: convertIfObject(source.author, c.toSimpleCaver),
    document: convertIfObject(source.document, c.toSimpleDocument),
    content: source.content, // TODO is this ok ? (format: {document, description} instead of a document object)
  }),

  toEntrance: (source, meta) => {
    const result = {
      ...EntranceModel,
    };
    const isSensitive = source.isSensitive ?? source.is_sensitive;

    result['@id'] = String(source.id);
    result.id = source.id;
    if (source.t_id) {
      // snapshot
      result.t_id = source.t_id;
    }
    result.isDeleted = source.isDeleted;
    result.isSensitive = isSensitive;
    result.isSensitiveLocked =
      source.isSensitiveLocked ?? source.is_sensitive_locked ?? false;
    result.hasBat = source.hasBat;
    result.dangerFlooding = source.dangerFlooding;
    result.dangerCo2 = source.dangerCo2;
    result.dangerRockfall = source.dangerRockfall;
    result.dangerPollution = source.dangerPollution;
    result.needCleanGear = source.needCleanGear;
    result.needStayOnTrail = source.needStayOnTrail;
    result.hasRules = source.hasRules;
    result.isTouristic = source.isTouristic;
    result.redirectTo = source.redirectTo;
    result.dateInscription = source.dateInscription;
    result.dateReviewed = source.dateReviewed;
    result.dateLastModif = source.dateLastModif;
    result.altitude = source.altitude;
    result.precision = source.precision;
    result.latitude =
      !isSensitive || meta?.hasCompleteViewRight === true
        ? parseFloat(source.latitude)
        : null;
    result.longitude =
      !isSensitive || meta?.hasCompleteViewRight === true
        ? parseFloat(source.longitude)
        : null;
    result.name = getMainName(source);
    result.discoveryYear = source.yearDiscovery;
    result.geology = source.geology;
    result.language = getMainLanguage(source);
    result.country = source.country?.id ?? source.country;
    result.region = source.region;
    result.county = source.county;
    result.city = source.city;
    result.iso3166 = source.iso_3166_2 ?? source.iso3166;
    result.commentsRating = source.commentsRating; // From search

    result.timeInfo = source.timeInfo; // Only used in random entrance
    // Convert objects
    if (source.cave instanceof Object) {
      result.cave = c.toSimpleCave(source.cave);
    } else {
      result.cave = source.cave;
    }
    // Once cave is populated, put the massifs at the root of the entrance
    // (more convenient for the client)
    // For search results, massifs come directly from the Typesense document
    if (Array.isArray(source.massifs) && source.massifs.length > 0) {
      result.massifs = source.massifs;
    } else {
      result.massifs = toList('massifs', source.cave ?? {}, c.toSimpleMassif);
    }
    // Only include snapshot-specific fields when set by the snapshot code path
    if (source.caveName !== undefined) {
      result.caveName = source.caveName ?? null;
    }
    if (source.isNameChangeSnapshot !== undefined) {
      result.isNameChangeSnapshot = source.isNameChangeSnapshot ?? false;
    }
    if (source.isEnrichment !== undefined) {
      result.isEnrichmentSnapshot = source.isEnrichment ?? false;
    }
    result.author = convertIfObject(source.author, c.toSimpleCaver);
    result.reviewer = convertIfObject(source.reviewer, c.toSimpleCaver);
    // Convert collections
    result.names = toList('names', source, c.toName);
    result.descriptions = toList(
      'descriptions',
      source,
      c.toSimpleDescription,
      { filterDeleted: false }
    );
    result.comments = toList('comments', source, c.toSimpleComment, {
      filterDeleted: false,
    });
    result.documents = toList('documents', source, c.toCitationDocument);
    result.histories = toList('histories', source, c.toSimpleHistory, {
      filterDeleted: false,
    });
    result.locations =
      !source.isSensitive || meta?.hasCompleteViewRight === true
        ? toList('locations', source, c.toSimpleLocation, {
            filterDeleted: false,
          })
        : [];
    result.riggings = toList('riggings', source, c.toSimpleRigging, {
      filterDeleted: false,
    });

    const countryList = toList(
      'country',
      source.guidelines || {},
      c.toSimpleGuideline
    );
    const regionList = toList(
      'region',
      source.guidelines || {},
      c.toSimpleGuideline
    );
    const massifList = toList(
      'massif',
      source.guidelines || {},
      c.toSimpleGuideline
    );

    if (
      countryList.length === 0 &&
      regionList.length === 0 &&
      massifList.length === 0
    ) {
      result.guidelines = [];
    } else {
      result.guidelines = {
        country: countryList,
        region: regionList,
        massif: massifList,
      };
    }

    if (source.qualityData) {
      result.dataQuality = {
        total: getQualityData(source.qualityData),
        categories: getQualityBreakdown(source.qualityData),
        lastComputedAt: source.qualityData.date_of_update,
      };
    } else if (typeof source.dataQuality === 'number') {
      // Pass through integer score from Typesense search documents
      result.dataQuality = source.dataQuality;
    } else {
      result.dataQuality = null;
    }

    return result;
  },

  toSimpleEntrance: (source, meta) => ({
    id: source.id,
    name: getMainName(source),
    language: getMainLanguage(source),
    country: source.country?.id ?? source.country,
    region: source.region,
    county: source.county,
    city: source.city,
    iso3166: source.iso_3166_2 ?? source.iso3166,
    latitude:
      !source.isSensitive || meta?.hasCompleteViewRight === true
        ? parseFloat(source.latitude)
        : null,
    longitude:
      !source.isSensitive || meta?.hasCompleteViewRight === true
        ? parseFloat(source.longitude)
        : null,
    isSensitive: source.isSensitive,
    isDeleted: source.isDeleted,
  }),

  toEntranceDuplicate: (source, meta) => {
    const result = {
      ...EntranceDuplicateModel,
    };

    result.id = source.id;
    result.content = source.content;
    result.datePublication = source.datePublication;

    // Convert objects
    const { toSimpleCaver, toEntrance } = module.exports;
    result.author =
      source.author instanceof Object
        ? toSimpleCaver(source.author)
        : source.author;
    result.entrance =
      source.entrance instanceof Object
        ? toEntrance(source.entrance, meta)
        : source.entrance;

    return result;
  },

  toFile: (source) => {
    const hasThumbnails =
      source.thumbnailSmall || source.thumbnailMedium || source.thumbnailLarge;
    return {
      id: source.id,
      dateInscription: source.dateInscription,
      isValidated: source.isValidated,
      fileName: source.fileName,
      completePath: FileService.document.getUrl(source.path),
      thumbnails: hasThumbnails
        ? {
            small: source.thumbnailSmall
              ? FileService.document.getUrl(source.thumbnailSmall)
              : null,
            medium: source.thumbnailMedium
              ? FileService.document.getUrl(source.thumbnailMedium)
              : null,
            large: source.thumbnailLarge
              ? FileService.document.getUrl(source.thumbnailLarge)
              : null,
          }
        : null,
    };
  },

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

  toHistory: (source, meta) => ({
    ...c.toSimpleHistory(source),
    entrance: convertIfObject(source.entrance, c.toSimpleEntrance, { meta }),
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

  toLocation: (source, meta) => ({
    ...c.toSimpleLocation(source),
    entrance: convertIfObject(source.entrance, c.toSimpleEntrance, { meta }),
    massif: convertIfObject(source.massif, c.toSimpleMassif),
    cave: convertIfObject(source.cave, c.toSimpleCave),
  }),

  toMassif: (source) => ({
    ...MassifModel,
    id: source.id,
    '@id': String(source.id),
    isDeleted: source.isDeleted,
    isSensitive: source.isSensitive,
    isSensitiveLocked: source.isSensitiveLocked ?? false,
    redirectTo: source.redirectTo,
    author: convertIfObject(source.author, c.toSimpleCaver),
    reviewer: convertIfObject(source.reviewer, c.toSimpleCaver),
    dateInscription: source.dateInscription,
    dateReviewed: source.dateReviewed,
    name: getMainName(source),
    names: toList('names', source, c.toName),
    language: getMainLanguage(source),
    geogPolygon: source.geoJson,
    nbEntrances: source.nbEntrances, // from search
    descriptions: toList('descriptions', source, c.toSimpleDescription),
    documents: toList('documents', source, c.toCitationDocument),
    networks: toList('networks', source, c.toSimpleCave),
    guidelines: toList('guidelines', source, c.toSimpleGuideline),
    organizations: toList('organizations', source, c.toManagingOrganization, {
      filterDeleted: false,
    }),
  }),

  toSimpleMassif: (source) => ({
    id: source.id,
    name: getMainName(source),
    language: getMainLanguage(source),
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

  toNotification: (source, meta) => {
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
    result.cave = convertIfObject(source.cave, c.toCave, { meta });
    result.comment = convertIfObject(source.comment, c.toComment, { meta });
    result.description = convertIfObject(source.description, c.toDescription, {
      meta,
    });
    result.document = convertIfObject(source.document, c.toSimpleDocument);
    result.entrance = convertIfObject(source.entrance, c.toEntrance, { meta });
    result.history = convertIfObject(source.history, c.toHistory, { meta });
    result.location = convertIfObject(source.location, c.toLocation, { meta });
    result.massif = convertIfObject(source.massif, c.toMassif);
    result.notified = convertIfObject(source.notified, c.toSimpleCaver, {
      meta,
    });
    result.notifier = convertIfObject(source.notifier, c.toSimpleCaver, {
      meta,
    });
    result.organization = convertIfObject(source.grotto, c.toOrganization, {
      meta,
    });
    result.rigging = convertIfObject(source.rigging, c.toRigging, { meta });
    return result;
  },

  // Schema for an entry in a geographic entity's `organizations` list, as built
  // by GeoAssociationService.getFormattedOrganizations. Defining it here (rather
  // than passing the service shape through verbatim) keeps the output schema
  // enforced at the converter level, like every other collection. A soft-deleted
  // managing organization is reduced to a redirect stub per Requirement 6.3, so
  // callers must use { filterDeleted: false } with toList to keep those entries.
  toManagingOrganization: (source) =>
    source.isDeleted
      ? {
          id: source.id,
          isDeleted: true,
          redirectTo: source.redirectTo ?? null,
        }
      : {
          id: source.id,
          name: source.name ?? null,
          language: source.language ?? null,
        },

  toSimpleOrganization: (source) => ({
    id: source.id,
    name: getMainName(source),
    language: getMainLanguage(source),
    isDeleted: source.isDeleted,
  }),

  toOrganization: (source, meta) => ({
    ...OrganizationModel,
    id: source.id,
    '@id': String(source.id),
    isDeleted: source.isDeleted,
    redirectTo: source.redirectTo,
    dateInscription: source.dateInscription,
    dateReviewed: source.dateReviewed,
    author: convertIfObject(source.author, c.toSimpleCaver),
    reviewer: convertIfObject(source.reviewer, c.toSimpleCaver),
    name: getMainName(source),
    nameId: Array.isArray(source.names)
      ? source.names.find((name) => name.isMain)?.id // PostgreSQL
      : undefined,
    language: Array.isArray(source.names)
      ? source.names.find((name) => name.isMain)?.language
      : source.language,
    latitude: parseFloat(source.latitude),
    longitude: parseFloat(source.longitude),
    country: source.country?.id ?? source.country,
    region: source.region,
    county: source.county,
    city: source.city,
    address: source.address,
    postalCode: source.postalCode,
    iso3166: source.iso_3166_2 ?? source.iso3166,
    mail: source.mail,
    url: source.url,
    customMessage: source.customMessage,
    isOfficialPartner: source.isOfficialPartner,
    pictureFileName: source.pictureFileName,
    yearBirth: source.yearBirth,
    nbCavers: source.nbCavers, // From search
    cavers: toList('cavers', source, c.toSimpleCaver),
    documents: toList('documents', source, c.toSimpleDocument),
    exploredEntrances: toList('exploredEntrances', source, c.toSimpleEntrance, {
      meta,
    }),
    exploredNetworks: toList('exploredNetworks', source, c.toSimpleCave),
    partnerEntrances: toList('partnerEntrances', source, c.toSimpleEntrance, {
      meta,
    }),
    partnerNetworks: toList('partnerNetworks', source, c.toSimpleCave),
    managedCountries:
      source.managedCountries?.map((country) => ({
        id: country.id,
        nativeName: country.nativeName,
        enName: country.enName,
        frName: country.frName,
        esName: country.esName,
        deName: country.deName,
        bgName: country.bgName,
        itName: country.itName,
        caName: country.caName,
        nlName: country.nlName,
        rsName: country.rsName,
      })) || [],
    managedRegions:
      source.managedRegions?.map((region) => ({
        id: region.id,
        name: region.name,
        nameEn: region.nameEn,
        nameFr: region.nameFr,
        nameEs: region.nameEs,
        nameDe: region.nameDe,
        nameBg: region.nameBg,
        nameIt: region.nameIt,
        nameCa: region.nameCa,
        nameNl: region.nameNl,
      })) || [],
    managedMassifs:
      source.managedMassifs?.map((massif) => ({
        id: massif.id,
        names:
          massif.names?.map((n) => ({
            id: n.id,
            name: n.name,
            isMain: n.isMain,
            language: n.language,
          })) || [],
      })) || [],
  }),

  toSensorConfiguration: (source) => ({
    id: source.id,
    device: source.device,
    quantityKind:
      source.quantityKind instanceof Object
        ? {
            id: source.quantityKind.id,
            code: source.quantityKind.code,
            url: source.quantityKind.url,
            symbolSi: source.quantityKind.symbolSi,
            displayUnit:
              source.quantityKind.displayUnit instanceof Object
                ? {
                    id: source.quantityKind.displayUnit.id,
                    code: source.quantityKind.displayUnit.code,
                    symbol: source.quantityKind.displayUnit.symbol,
                  }
                : source.quantityKind.displayUnit,
          }
        : source.quantityKind,
    unit:
      source.unit instanceof Object
        ? {
            id: source.unit.id,
            code: source.unit.code,
            symbol: source.unit.symbol,
            siToDisplayFactor: source.unit.siToDisplayFactor,
            siToDisplayOffset: source.unit.siToDisplayOffset,
          }
        : source.unit,
    label: source.label,
    substance:
      source.substance instanceof Object
        ? {
            id: source.substance.id,
            name: source.substance.name,
            formula: source.substance.formula || null,
            casNumber: source.substance.casNumber || null,
            externalId: source.substance.externalId || null,
            externalSource: source.substance.externalSource || null,
          }
        : source.substance || null,
    precisionUpper: source.precisionUpper,
    precisionLower: source.precisionLower,
    resolution: source.resolution,
    detectionLimitMin: source.detectionLimitMin,
    detectionLimitMax: source.detectionLimitMax,
    dateInscription: source.dateInscription,
    dateReviewed: source.dateReviewed,
    isDeleted: source.isDeleted,
    author: convertIfObject(source.author, c.toSimpleCaver),
    reviewer: convertIfObject(source.reviewer, c.toSimpleCaver),
  }),

  toDevice: (source) => ({
    id: source.id,
    name: source.name,
    brandName: source.brandName,
    serialNumber: source.serialNumber,
    productUrl: source.productUrl,
    manufacturerUrl: source.manufacturerUrl,
    dateInscription: source.dateInscription,
    dateReviewed: source.dateReviewed,
    isDeleted: source.isDeleted,
    author: convertIfObject(source.author, c.toSimpleCaver),
    reviewer: convertIfObject(source.reviewer, c.toSimpleCaver),
    configurations: source.configurations ?? [],
  }),

  toSimpleDevice: (source) => ({
    id: source.id,
    name: source.name,
    brandName: source.brandName,
    serialNumber: source.serialNumber,
    productUrl: source.productUrl,
    manufacturerUrl: source.manufacturerUrl,
    isDeleted: source.isDeleted,
    author: source.authorId
      ? { id: source.authorId, nickname: source.authorNickname }
      : convertIfObject(source.author, c.toSimpleCaver),
  }),

  toDeletedEntity: (source) => ({
    id: source.id,
    isDeleted: source.isDeleted,
    redirectTo: source.redirectTo,
    author: convertIfObject(source.author, c.toSimpleCaver),
    reviewer: convertIfObject(source.reviewer, c.toSimpleCaver),
    dateInscription: source.dateInscription,
    dateReviewed: source.dateReviewed,
    name: getMainName(source) ?? source.title, // title is for document
    language: getMainLanguage(source),
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

  toRigging: (source, meta) => ({
    ...c.toSimpleRigging(source),
    entrance: convertIfObject(source.entrance, c.toSimpleEntrance, { meta }),
    cave: convertIfObject(source.cave, c.toSimpleCave),
  }),

  toSimpleGuideline: (source) => {
    const result = {
      ...GuidelineModel,
      id: source.id,
      title: source.title,
      description: source.description,
      countries: toList(
        'countries',
        source,
        (country) => country.id || country
      ),
      regions: toList('regions', source, (region) => region.id || region),
      massifs: toList('massifs', source, (massif) =>
        massif instanceof Object ? c.toSimpleMassif(massif) : { id: massif }
      ),
      dateInscription: source.dateInscription,
      dateReviewed: source.dateReviewed,
      isDeleted: source.isDeleted,
      author: convertIfObject(source.author, c.toSimpleCaver),
      reviewer: convertIfObject(source.reviewer, c.toSimpleCaver),
      language: convertIfObject(source.language, c.toLanguage),
    };
    if (source.t_id) {
      result.t_id = source.t_id;
    }
    return result;
  },

  // Transform the typesense response
  toSearchResult: (source, meta) => {
    // For each result of the search, convert the item and add it to the json to send
    const defaultType =
      source.request_params?.collection_name.split('_')[0] ?? '';
    const results = source.hits.map((item) => {
      const _type = item.collection?.split('_')[0] ?? defaultType;
      let data = {};

      if (_type === 'persons') data = c.toCaver(item.document, meta);
      else if (_type === 'documents') {
        data = c.toDocument(item.document, meta);
        // Strip arrays not needed in search responses
        delete data.files;
        delete data.newFiles;
        delete data.modifiedFiles;
        delete data.deletedFiles;
      } else if (_type === 'caves')
        data = c.toSimpleCave(item.document, meta); // Only used in quick search
      else if (_type === 'entrances') {
        data = c.toEntrance(item.document, meta);
        // Strip arrays not needed in search responses (transitional: old indexed
        // documents may still carry these until the post-deploy full re-sync)
        delete data.comments;
        delete data.descriptions;
        delete data.histories;
        delete data.riggings;
        delete data.locations;
        delete data.documents;
        delete data.names;
        if (data.cave) delete data.cave.exploringOrganizations;
      } else if (_type === 'organizations') {
        data = c.toOrganization(item.document, meta);
        // Strip arrays not needed in search responses
        delete data.cavers;
        delete data.documents;
        delete data.exploredEntrances;
        delete data.exploredNetworks;
        delete data.partnerEntrances;
        delete data.partnerNetworks;
      } else if (_type === 'massifs') {
        data = c.toMassif(item.document);
        // Strip arrays not needed in search responses
        delete data.descriptions;
        delete data.documents;
        delete data.networks;
      } else if (_type === 'devices') data = c.toSimpleDevice(item.document);

      return {
        ...data,
        // Add the type and hightlight to the data
        _type,
        _highlights: item.highlight,
      };
    });

    return {
      results,
      totalResults: source.found,
      totalEntities: source.out_of,
      page: source.page,
    };
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
