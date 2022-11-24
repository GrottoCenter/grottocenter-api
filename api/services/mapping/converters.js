/* eslint-disable no-underscore-dangle */
const ramda = require('ramda');
const { postgreIntervalObjectToDbString } = require('../CommentService');
const CaveModel = require('./models/CaveModel');
const CaverModel = require('./models/CaverModel');
const CommentModel = require('./models/CommentModel');
const CountResultModel = require('./models/CountResultModel');
const DescriptionModel = require('./models/DescriptionModel');
const DocumentModel = require('./models/DocumentModel');
const EntranceModel = require('./models/EntranceModel');
const DocumentDuplicateModel = require('./models/DocumentDuplicateModel');
const EntranceDuplicateModel = require('./models/EntranceDuplicateModel');
const HistoryModel = require('./models/HistoryModel');
const LanguageModel = require('./models/LanguageModel');
const LocationModel = require('./models/LocationModel');
const MassifModel = require('./models/MassifModel');
const NameModel = require('./models/NameModel');
const NotificationModel = require('./models/NotificationModel');
const OrganizationModel = require('./models/OrganizationModel');
const RiggingModel = require('./models/RiggingModel');
const SubjectModel = require('./models/SubjectModel');
const { getMainName, toList } = require('./utils');
const FileService = require('../FileService');
const RiggingService = require('../RiggingService');

module.exports = {
  toCave: (source) => {
    const result = {
      ...CaveModel,
    };
    result.id = source.id;
    result['@id'] = String(source.id);

    result.dateInscription = source.date_inscription;
    result.dateReviewed = source.date_reviewed;
    result.depth = source.depth;
    result.isDeleted = source.is_deleted;
    result.isDiving = source.is_diving;
    result.latitude = parseFloat(source.latitude);
    result.length = source.length;
    result.longitude = parseFloat(source.longitude);
    result.name = getMainName(source);
    result.names = source.names;
    result.temperature = source.temperature;

    // Convert objects
    result.author =
      source.id_author instanceof Object
        ? module.exports.toCaver(source.id_author)
        : source.id_author;

    result.reviewer =
      source.id_reviewer instanceof Object
        ? module.exports.toCaver(source.id_reviewer)
        : source.id_reviewer;

    // Convert collections
    const { toEntrance, toDescription, toDocument, toHistory, toMassif } =
      module.exports;

    result.descriptions = toList('descriptions', source, toDescription);
    result.entrances = toList('entrances', source, toEntrance);
    result.documents = toList('documents', source, toDocument);
    result.histories = toList('histories', source, toHistory);
    result.massifs = toList('massifs', source, toMassif);

    return result;
  },

  toCaver: (source) => {
    const result = {
      ...CaverModel,
    };
    result.id = source.id;
    result['@id'] = String(source.id);
    result.language = source.language;
    result.nickname = source.nickname;
    result.name = source.name;
    result.surname = source.surname;

    const { toDocument, toEntrance, toOrganization } = module.exports;

    // Convert collections
    if (source.documents) {
      if (source.documents instanceof Array) {
        result.documents = toList('documents', source, toDocument);
      } else {
        result.documents = source.documents.split(',').map((documentId) => ({
          id: parseInt(documentId, 10),
        }));
      }
    }

    if (source.exploredEntrances) {
      if (source.exploredEntrances instanceof Array) {
        result.exploredEntrances = toList(
          'exploredEntrances',
          source,
          toEntrance
        );
      } else {
        result.exploredEntrances = source.exploredEntrances
          .split(',')
          .map((entranceId) => ({
            id: parseInt(entranceId, 10),
          }));
      }
    }

    if (source.groups) {
      if (source.groups instanceof Array) {
        result.groups = source.groups;
      } else {
        result.groups = source.groups.split(',').map((groupId) => ({
          id: parseInt(groupId, 10),
        }));
      }
    }

    if (source.grottos) {
      if (source.grottos instanceof Array) {
        result.organizations = toList('organizations', source, toOrganization);
      } else {
        result.organizations = source.grottos.split(',').map((grottoId) => ({
          id: parseInt(grottoId, 10),
        }));
      }
    }

    return result;
  },

  toComment: (source) => {
    const result = {
      ...CommentModel,
    };

    result.aestheticism = source.aestheticism;
    result.approach = source.approach;
    result.body = source.body;
    result.caving = source.caving;
    result.dateInscription = source.dateInscription;
    result.dateReviewed = source.dateReviewed;
    result.eTTrail = postgreIntervalObjectToDbString(source.eTTrail);
    result.eTUnderground = postgreIntervalObjectToDbString(
      source.eTUnderground
    );
    result.id = source.id;
    result.isDeleted = source.isDeleted;
    result.point = source.point;
    result.relevance = source.relevance;
    result.title = source.title;

    // Convert objects
    const { toCave, toCaver, toEntrance, toLanguage } = module.exports;
    result.author =
      source.author instanceof Object ? toCaver(source.author) : source.author;
    result.cave =
      source.cave instanceof Object ? toCave(source.cave) : source.cave;
    result.entrance =
      source.entrance instanceof Object
        ? toEntrance(source.entrance)
        : source.entrance;
    result.language =
      source.language instanceof Object
        ? toLanguage(source.language)
        : source.language;
    result.reviewer =
      source.reviewer instanceof Object
        ? toCaver(source.reviewer)
        : source.reviewer;

    return result;
  },

  toCompleteSearchResult: (source) => {
    const res = {};
    const values = [];
    const {
      toCave,
      toCaver,
      toDocument,
      toEntrance,
      toLanguage,
      toMassif,
      toOrganization,
    } = module.exports;

    // For each result of the research, convert the item and add it to the json to send
    source.hits.hits.forEach((item) => {
      let data = '';
      // Convert the data according to its first tag
      switch (item._source.tags[0]) {
        case 'cave':
          data = toCave(item._source);
          break;
        case 'caver':
          data = toCaver(item._source);
          break;
        case 'document':
          data = toDocument(item._source);
          break;
        case 'entrance':
          data = toEntrance(item._source);
          break;
        case 'grotto':
          data = toOrganization(item._source);
          break;
        case 'language':
          data = toLanguage(item._source);
          break;
        case 'massif':
          data = toMassif(item._source);
          break;
        case 'network':
          data = toCave(item._source);
          break;
        default:
      }
      // Add the type and hightlight of the data
      data.type = item._source.tags[0];
      data.highlights = item.highlight;

      values.push(data);
    });
    res.results = values;
    res.totalNbResults = source.hits.total.value;
    return res;
  },

  toCountResult: (source) => {
    const result = {
      ...CountResultModel,
    };
    result.count = source.count;
    return result;
  },

  toDescription: (source) => {
    const result = {
      ...DescriptionModel,
    };

    result.body = source.body;
    result.dateInscription = source.dateInscription;
    result.dateReviewed = source.dateReviewed;
    result.id = source.id;
    result.point = source.point;
    result.relevance = source.relevance;
    result.title = source.title;

    // Convert objects
    const { toCave, toCaver, toDocument, toEntrance, toLanguage, toMassif } =
      module.exports;
    result.author =
      source.author instanceof Object ? toCaver(source.author) : source.author;
    result.cave =
      source.cave instanceof Object ? toCave(source.cave) : source.cave;
    result.document =
      source.document instanceof Object
        ? toDocument(source.document)
        : source.document;
    result.entrance =
      source.entrance instanceof Object
        ? toEntrance(source.entrance)
        : source.entrance;
    result.exit =
      source.exit instanceof Object ? toEntrance(source.exit) : source.exist;
    result.massif =
      source.massif instanceof Object ? toMassif(source.massif) : source.massif;
    result.reviewer =
      source.reviewer instanceof Object
        ? toCaver(source.reviewer)
        : source.reviewer;
    result.language =
      source.language instanceof Object
        ? toLanguage(source.language)
        : source.language;

    return result;
  },

  toDocument: (source) => {
    const result = {
      ...DocumentModel,
    };

    // Conversion (from Elasticsearch or not)
    result.id = source.id;
    result['@id'] = String(source.id);
    result.authorComment = source.authorComment;
    result.cave = source.cave;
    result.dateInscription = source.dateInscription;
    result.datePublication = source.date_publication
      ? source.date_publication
      : source.datePublication;
    result.dateReviewed = source.dateReviewed;
    result.dateValidation = source.dateValidation;
    result.deletedFiles = source.deletedFiles;
    result.entrance = source.entrance;
    result.identifier = source.identifier;
    result.intactDescriptions = source.descriptions;
    result.issue = source.issue;
    result.isValidated = source.isValidated;
    result.languages = source.languages;
    result.license = source.license;
    result.mainLanguage = source.mainLanguage;
    result.massif = source.massif;
    result.modifiedDocJson = source.modifiedDocJson;
    result.modifiedFiles = source.modifiedFiles;
    result.newFiles = source.newFiles;
    result.option = source.option;
    result.pages = source.pages;
    // TODO: handle publication (old bbs & parent)
    result.publication = source.publication_other_bbs_old
      ? source.publication_other_bbs_old
      : source.publicationOtherBBSOld;
    result.publicationFasciculeBBSOld = source.publicationFasciculeBBSOld;
    result.refBbs = source.ref_bbs ? source.ref_bbs : source.refBbs;
    result.title = source.title;
    result.validationComment = source.validationComment;

    // Convert objects
    const { toCaver, toDocument, toFile, toOrganization, toSubject } =
      module.exports;
    result.author =
      source.author instanceof Object ? toCaver(source.author) : source.author;

    result.reviewer =
      source.reviewer instanceof Object
        ? toCaver(source.reviewer)
        : source.reviewer;

    result.validator =
      source.validator instanceof Object
        ? toCaver(source.validator)
        : source.validator;

    result.authorizationDocument =
      source.authorizationDocument instanceof Object
        ? toDocument(source.authorizationDocument)
        : source.authorizationDocument;

    result.parent =
      source.parent instanceof Object
        ? toDocument(source.parent)
        : source.parent;

    // source.descriptions contains both title and descriptions (in .title and .body)
    // Split them in 2 different attributes
    if (source.descriptions) {
      result.descriptions = source.descriptions.map((d) => ({
        ...ramda.omit(['title', 'body'], d),
        text: d.body,
      }));
      result.titles = source.descriptions.map((d) => ({
        ...ramda.omit(['title', 'body'], d),
        text: d.title,
      }));
    }

    // Convert identifier type
    if (source.identifierType instanceof Object) {
      result.identifierType = {
        ...source.identifierType,
        id: ramda.pipe(
          ramda.pathOr(undefined, ['identifierType', 'id']),
          (id) => (id ? id.trim() : id)
        )(source),
      };
    } else {
      result.identifierType = source.identifierType;
    }

    // Library
    if (source['library id']) {
      // Elasticsearch
      result.library = {
        id: source['library id'],
        name: source['library name'],
      };
    } else {
      result.library =
        source.library instanceof Object
          ? toOrganization(source.library)
          : source.library;
    }

    // Editor
    if (source['editor id']) {
      // Elasticsearch
      result.editor = {
        id: source['editor id'],
        name: source['editor name'],
      };
    } else {
      result.editor =
        source.editor instanceof Object
          ? toOrganization(source.editor)
          : source.editor;
    }

    // Type
    if (source['type id']) {
      // ES
      result.type = {
        id: source['type id'],
        name: source['type name'],
      };
    }
    // Build document type
    // source.type can be the id of the type only or the full type object
    if (source.type) {
      if (ramda.propOr(null, 'id', source.type)) {
        result.type = source.type;
      } else {
        result.type = {
          id: source.type,
        };
      }
    }

    // Convert collections

    result.authors = toList('authors', source, toCaver);
    result.children = toList('children', source, toDocument);
    result.files = toList('files', source, toFile);

    if (source.subjects instanceof Array) {
      result.subjects = toList('subjects', source, toSubject);
    } else {
      // Elasticsearch
      result.subjects = source.subjects
        ? source.subjects.split(', ').map((s) => ({
            code: s,
          }))
        : null;
    }

    // Convert regions
    if (source.regions) {
      if (source.regions instanceof Array) {
        result.regions = source.regions;
      } else {
        // Elasticsearch
        result.regions = source.regions
          ? source.regions.split(', ').map((r) => ({
              name: r,
            }))
          : null;
      }
    }

    return result;
  },

  toDocumentDuplicate: (source) => {
    const result = {
      ...DocumentDuplicateModel,
    };
    const { toCaver, toDocument } = module.exports;
    result.id = source.id;
    // When comming from a duplicate list, the content can't be casted to a full document model.
    // Detect this "simple" content by checking the number of keys (2: document and description)
    if (Object.keys(source.content).length === 2) {
      result.content = source.content;
    } else {
      result.content = toDocument(source.content);
    }
    result.datePublication = source.datePublication;

    // Convert objects
    result.author =
      source.author instanceof Object ? toCaver(source.author) : source.author;
    result.document =
      source.document instanceof Object
        ? toDocument(source.document)
        : source.document;

    return result;
  },

  toEntrance: (source) => {
    const result = {
      ...EntranceModel,
    };

    result['@id'] = String(source.id);
    result.address = source.address;
    result.aestheticism = source.aestheticism;
    result.altitude = source.altitude;
    result.approach = source.approach;
    result.caving = source.caving;
    result.country = source.country;
    result.countryCode = source['country code'];
    result.county = source.county;
    result.city = source.city;
    result.dateInscription = source.dateInscription;
    result.dateReviewed = source.dateReviewed;
    result.discoveryYear = source.yearDiscovery;
    result.externalUrl = source.externalUrl;
    result.id = source.id;
    result.isDeleted = source.isDeleted;
    result.isSensitive = source.isSensitive;
    result.latitude = parseFloat(source.latitude);
    result.longitude = parseFloat(source.longitude);
    result.name = getMainName(source);
    result.names = source.names;
    result.postalCode = source.postalCode;
    result.precision = source.precision;
    result.region = source.region;
    result.stats = source.stats;
    result.timeInfo = source.timeInfo;

    // Convert objects
    const {
      toCave,
      toCaver,
      toComment,
      toDescription,
      toDocument,
      toHistory,
      toLocation,
      toRigging,
    } = module.exports;

    if (source['cave name']) {
      // from Elasticsearch
      result.cave = {
        depth: source['cave depth'],
        length: source['cave length'],
        name: source['cave name'],
        isDiving: source['cave is diving'],
      };
    } else if (source.cave instanceof Object) {
      result.cave = toCave(source.cave);
    } else {
      result.cave = source.cave;
    }
    // Once cave is populated, put the massifs at the root of the entrance
    // (more convenient for the client)
    result.massifs = ramda.pathOr(undefined, ['cave', 'massifs'], result);

    // Author
    if (source.author instanceof Object) {
      result.author = toCaver(source.author);
    }

    // Convert collections
    result.descriptions = toList('descriptions', source, toDescription);
    result.comments = toList('comments', source, toComment);
    result.documents = toList('documents', source, toDocument);
    result.histories = toList('histories', source, toHistory);
    result.locations = toList('locations', source, toLocation);
    result.riggings = toList('riggings', source, toRigging);

    // Massif from Elasticsearch
    if (source['massif name']) {
      result.massifs = {
        name: source['massif name'],
      };
    }

    return result;
  },

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

  toFile: (source) => {
    const { container, linkAccount } = FileService.getAzureData();
    return {
      ...source,
      completePath: `${linkAccount}/${container}/${source.path}`,
    };
  },

  toHistory: (source) => {
    const result = {
      ...HistoryModel,
    };

    result.body = source.body;
    result.dateInscription = source.dateInscription;
    result.dateReviewed = source.dateReviewed;
    result.id = source.id;
    result.point = source.point;
    result.relevance = source.relevance;

    // Convert objects
    const { toCave, toCaver, toEntrance, toLanguage } = module.exports;
    result.author =
      source.author instanceof Object ? toCaver(source.author) : source.author;
    result.cave =
      source.cave instanceof Object ? toCave(source.cave) : source.cave;
    result.entrance =
      source.entrance instanceof Object
        ? toEntrance(source.entrance)
        : source.entrance;
    result.reviewer =
      source.reviewer instanceof Object
        ? toCaver(source.reviewer)
        : source.reviewer;
    result.language =
      source.language instanceof Object
        ? toLanguage(source.language)
        : source.language;
    return result;
  },

  toLanguage: (source) => {
    const result = {
      ...LanguageModel,
    };
    result.id = source.id;
    result.comment = source.comment;
    result.isPrefered = source.isPrefered;
    result.part2b = source.part2b;
    result.part2t = source.part2t;
    result.part1 = source.part1;
    result.refName = source.refName;
    result.scope = source.scope;
    result.type = source.type;

    const { toDocument } = module.exports;

    // Convert collections
    result.documents = toList('documents', source, toDocument);

    return result;
  },

  toLocation: (source) => {
    const result = {
      ...LocationModel,
    };

    result.body = source.body;
    result.dateInscription = source.dateInscription;
    result.dateReviewed = source.dateReviewed;
    result.id = source.id;
    result.relevance = source.relevance;
    result.title = source.title;

    // Convert objects
    const { toCaver, toEntrance, toLanguage } = module.exports;
    result.author =
      source.author instanceof Object ? toCaver(source.author) : source.author;
    result.entrance =
      source.entrance instanceof Object
        ? toEntrance(source.entrance)
        : source.entrance;
    result.language =
      source.language instanceof Object
        ? toLanguage(source.language)
        : source.language;
    result.reviewer =
      source.reviewer instanceof Object
        ? toCaver(source.reviewer)
        : source.reviewer;

    return result;
  },

  toMassif: (source) => {
    const result = {
      ...MassifModel,
    };

    result.id = source.id;
    result['@id'] = String(source.id);
    result.dateInscription = source.dateInscription;
    result.dateReviewed = source.dateReviewed;
    result.geogPolygon = source.geoJson;
    result.name = getMainName(source);
    result.names = source.names;
    result.nbCaves = source['nb caves']; // from Elasticsearch
    result.nbEntrances = source['nb entrances']; // from Elasticsearch

    // Convert objects
    const { toCave, toCaver, toDocument, toEntrance } = module.exports;
    if (source.author) {
      result.author =
        source.author instanceof Object
          ? toCaver(source.author)
          : source.author;
    }
    if (source.reviewer) {
      result.reviewer =
        source.reviewer instanceof Object
          ? toCaver(source.reviewer)
          : source.reviewer;
    }

    // Convert collections
    result.entrances = toList('entrances', source, toEntrance);
    result.descriptions = toList('entrances', source, toEntrance);
    result.documents = toList('documents', source, toDocument);
    result.networks = toList('networks', source, toCave);

    return result;
  },

  toName: (source) => {
    const result = {
      ...NameModel,
    };

    result.dateInscription = source.dateInscription;
    result.dateReviewed = source.dateReviewed;
    result.id = source.id;
    result.isMain = source.isMain;
    result.language = source.language;
    result.name = source.name;
    result.point = source.point;

    // Convert objects
    const { toCave, toCaver, toEntrance, toMassif, toOrganization } =
      module.exports;
    result.author =
      source.author instanceof Object ? toCaver(source.author) : source.author;
    result.cave =
      source.cave instanceof Object ? toCave(source.cave) : source.cave;
    result.entrance =
      source.entrance instanceof Object
        ? toEntrance(source.entrance)
        : source.entrance;
    result.massif =
      source.massif instanceof Object ? toMassif(source.massif) : source.massif;
    result.organization =
      source.grotto instanceof Object
        ? toOrganization(source.grotto)
        : source.grotto;
    result.reviewer =
      source.reviewer instanceof Object
        ? toCaver(source.reviewer)
        : source.reviewer;

    return result;
  },

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
    const {
      toCave,
      toCaver,
      toComment,
      toDescription,
      toDocument,
      toEntrance,
      toHistory,
      toLocation,
      toMassif,
      toOrganization,
      toRigging,
    } = module.exports;
    result.cave =
      source.cave instanceof Object ? toCave(source.cave) : source.cave;
    result.comment =
      source.comment instanceof Object
        ? toComment(source.comment)
        : source.comment;
    result.description =
      source.description instanceof Object
        ? toDescription(source.description)
        : source.description;
    result.document =
      source.document instanceof Object
        ? toDocument(source.document)
        : source.document;
    result.entrance =
      source.entrance instanceof Object
        ? toEntrance(source.entrance)
        : source.entrance;
    result.history =
      source.history instanceof Object
        ? toHistory(source.history)
        : source.history;
    result.location =
      source.location instanceof Object
        ? toLocation(source.location)
        : source.location;
    result.massif =
      source.massif instanceof Object ? toMassif(source.massif) : source.massif;
    result.notified =
      source.notified instanceof Object
        ? toCaver(source.notified)
        : source.notified;
    result.notifier =
      source.notifier instanceof Object
        ? toCaver(source.notifier)
        : source.notifier;
    result.organization =
      source.grotto instanceof Object
        ? toOrganization(source.grotto)
        : source.grotto;
    result.rigging =
      source.rigging instanceof Object
        ? toRigging(source.rigging)
        : source.rigging;

    return result;
  },

  toOrganization: (source) => {
    const result = {
      ...OrganizationModel,
    };

    result.id = source.id;
    result['@id'] = String(source.id);
    result.address = source.address;
    result.city = source.city;
    result.customMessage = source.customMessage;
    result.country = source.country;
    result.countryCode = source['country code'];
    result.county = source.county;
    result.dateInscription = source.dateInscription;
    result.isOfficialPartner = source.isOfficialPartner;
    result.latitude = parseFloat(source.latitude);
    result.longitude = parseFloat(source.longitude);
    result.name = getMainName(source);
    result.names = source.names;
    result.nbCavers = source['nb cavers']; // from Elasticsearch
    result.mail = source.mail;
    result.pictureFileName = source.pictureFileName;
    result.postalCode = source.postalCode;
    result.region = source.region;
    result.url = source.url;
    result.village = source.village;
    result.yearBirth = source.yearBirth;

    // Convert collections
    const { toCave, toCaver, toDocument, toEntrance } = module.exports;
    result.cavers = toList('cavers', source, toCaver);
    result.documents = toList('documents', source, toDocument);
    result.exploredEntrances = toList('exploredEntrances', source, toEntrance);
    result.exploredNetworks = toList('exploredNetworks', source, toCave);
    result.partnerEntrances = toList('partnerEntrances', source, toEntrance);
    result.partnerNetworks = toList('partnerNetworks', source, toCave);

    return result;
  },

  toRigging: (source) => {
    const result = {
      ...RiggingModel,
    };
    result.anchors = source.anchors;
    result.dateInscription = source.dateInscription;
    result.dateReviewed = source.dateReviewed;
    result.id = source.id;
    result.isDeleted = source.isDeleted;
    result.observations = source.observations;
    result.obstacles = source.obstacles;
    result.point = source.point;
    result.relevance = source.relevance;
    result.ropes = source.ropes;
    result.title = source.title;
    RiggingService.formatRiggingForAPI(result);

    // Convert objects
    const { toCave, toCaver, toEntrance, toLanguage } = module.exports;
    result.author =
      source.author instanceof Object ? toCaver(source.author) : source.author;
    result.cave =
      source.cave instanceof Object ? toCave(source.cave) : source.cave;
    result.entrance =
      source.entrance instanceof Object
        ? toEntrance(source.entrance)
        : source.entrance;
    result.language =
      source.language instanceof Object
        ? toLanguage(source.language)
        : source.language;
    result.reviewer =
      source.reviewer instanceof Object
        ? toCaver(source.reviewer)
        : source.reviewer;

    return result;
  },

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
        : null;
    return result;
  },
};
