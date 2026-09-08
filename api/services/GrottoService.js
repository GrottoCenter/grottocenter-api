const CaveService = require('./CaveService');
const DocumentService = require('./DocumentService');
const SearchService = require('./SearchService');
const NameService = require('./NameService');
const NotificationService = require('./NotificationService');
const EnrichmentQueueService = require('./EnrichmentQueueService');
const RecentChangeService = require('./RecentChangeService');
const coerceToNumeric = require('../utils/coerceToNumeric');
const trimIfString = require('../utils/trimIfString');

// An organization can author or publish thousands of documents (the FFS
// publishes ~2000), so the payload carries a preview page and a total count
// instead of the whole set. Matches the cap CaverService uses for cavers.
const DOCUMENTS_PREVIEW_LIMIT = 10;

module.exports = {
  // Extract everything from a request body except id
  getConvertedDataFromClientRequest: (req) => ({
    address: trimIfString(req.param('address')),
    city: trimIfString(req.param('city')),
    country: req.body?.country?.id ?? null,
    county: trimIfString(req.param('county')),
    customMessage: trimIfString(req.param('customMessage')),
    latitude: coerceToNumeric(req.param('latitude')),
    longitude: coerceToNumeric(req.param('longitude')),
    mail: trimIfString(req.param('mail')),
    postalCode: trimIfString(req.param('postalCode')),
    region: trimIfString(req.param('region')),
    url: trimIfString(req.param('url')),
    yearBirth: req.param('yearBirth'), // numeric field — no trim needed
  }),

  getPopulatedOrganization: async (organizationId) => {
    const organization = await TGrotto.findOne({ id: organizationId })
      .populate('author')
      .populate('reviewer')
      .populate('names')
      .populate('cavers')
      .populate('country')
      // Only the most recent few are rendered; `authoredCount` below carries the
      // real total. Deleted documents are filtered in the query rather than
      // afterwards, so they cannot consume one of the slots.
      .populate('documents', {
        where: { isDeleted: false },
        limit: DOCUMENTS_PREVIEW_LIMIT,
        sort: [{ dateInscription: 'DESC' }],
      })
      .populate('exploredCaves')
      .populate('partnerCaves')
      .populate('managedCountries')
      .populate('managedRegions')
      .populate('managedMassifs');

    if (!organization) return null;

    await Promise.all([
      CaveService.setEntrances(organization.exploredCaves),
      CaveService.setEntrances(organization.partnerCaves),
    ]);

    await Promise.all([
      NameService.setNames(
        [...organization.exploredCaves, ...organization.partnerCaves],
        'cave'
      ),
      NameService.setNames([organization], 'grotto'),
      NameService.setNames(organization.managedMassifs, 'massif'),
    ]);

    // Split caves between entrances and networks (cave)
    organization.exploredNetworks = [];
    organization.exploredEntrances = [];
    for (const cave of organization.exploredCaves) {
      if (cave.entrances.length > 1) {
        organization.exploredNetworks.push(cave);
      }
      if (cave.entrances.length === 1) {
        organization.exploredEntrances.push(cave.entrances.pop());
      }
    }

    organization.partnerNetworks = [];
    organization.partnerEntrances = [];
    for (const cave of organization.partnerCaves) {
      if (cave.entrances.length > 1) {
        organization.partnerNetworks.push(cave);
      }
      if (cave.entrances.length === 1) {
        organization.partnerEntrances.push(cave.entrances.pop());
      }
    }

    // Set Entrances names
    await NameService.setNames(
      [...organization.exploredEntrances, ...organization.partnerEntrances],
      'entrance'
    );

    // Format organization
    delete organization.exploredCaves;
    delete organization.partnerCaves;

    // Authoring and publishing are distinct editorial relations, so they are
    // reported as two separate lists rather than merged: an organization that
    // wrote a topo is not the same as one that published someone else's.
    const authoredIds = organization.documents.map((e) => e.id);
    const publishedDocs = await TDocument.find({
      editor: organizationId,
      isDeleted: false,
    })
      .limit(DOCUMENTS_PREVIEW_LIMIT)
      .sort([{ dateInscription: 'DESC' }]);

    const publishedIds = publishedDocs.map((d) => d.id);

    const [
      authoredDocuments,
      publishedDocuments,
      authoredCount,
      publishedCount,
    ] = await Promise.all([
      DocumentService.getDocumentsForCitation(authoredIds),
      DocumentService.getDocumentsForCitation(publishedIds),
      DocumentService.countAuthoredByOrganization(organizationId),
      TDocument.count({ editor: organizationId, isDeleted: false }),
    ]);

    // getDocumentsForCitation re-queries by id, which loses the ordering the two
    // capped selections above were made with, so restore it here — the lists are
    // a "most recent first" preview and the frontend renders them as given.
    const orderByIds = (ids, documents) => {
      const byId = new Map(documents.map((d) => [d.id, d]));
      return ids.map((id) => byId.get(id)).filter(Boolean);
    };

    delete organization.documents;
    organization.authoredDocuments = orderByIds(authoredIds, authoredDocuments);
    organization.publishedDocuments = orderByIds(
      publishedIds,
      publishedDocuments
    );
    organization.authoredCount = authoredCount;
    organization.publishedCount = publishedCount;

    return organization;
  },
  /**
   * @param {*} req
   * @param {*} cleanedData
   * @param {*} nameData
   * @throws Sails ORM errors (see https://sailsjs.com/documentation/concepts/models-and-orm/errors)
   * @returns
   */
  createGrotto: async (req, cleanedData, nameData) => {
    // Defensive re-coercion: createGrotto can be called directly with raw
    // data that hasn't gone through getConvertedDataFromClientRequest, so we
    // ensure coordinates are coerced here as a safety net.
    // eslint-disable-next-line no-param-reassign
    cleanedData.latitude = coerceToNumeric(cleanedData.latitude);
    // eslint-disable-next-line no-param-reassign
    cleanedData.longitude = coerceToNumeric(cleanedData.longitude);

    const newOrganizationId = await sails
      .getDatastore()
      .transaction(async (db) => {
        const caver = await TCaver.findOne(nameData.author).usingConnection(db);

        if (nameData.language && nameData.language.length === 2) {
          const nameLang = await TLanguage.findOne({
            part1: nameData.language,
          }).usingConnection(db);
          // eslint-disable-next-line no-param-reassign
          if (nameLang) nameData.language = nameLang.id;
        }

        const newOrganization = await TGrotto.create(cleanedData)
          .fetch()
          .usingConnection(db);
        await TName.create({
          author: nameData.author,
          dateInscription: new Date(),
          grotto: newOrganization.id,
          isMain: true,
          language: nameData.language ? nameData.language : caver.language,
          name: nameData.text,
        })
          .fetch()
          .usingConnection(db);

        return newOrganization.id;
      });

    const newOrganizationPopulated =
      await module.exports.getPopulatedOrganization(newOrganizationId);

    if (cleanedData.latitude && cleanedData.longitude) {
      EnrichmentQueueService.enqueue(
        newOrganizationId,
        'organization',
        req.traceId
      ).catch((err) => {
        sails.log.error('Failed to enqueue organization enrichment:', err);
      });
    }

    await module.exports.updateInSearch(newOrganizationPopulated);

    await RecentChangeService.setNameCreate(
      'grotto',
      newOrganizationPopulated.id,
      req.token.id,
      nameData.text
    );

    await NotificationService.notifySubscribers(
      newOrganizationPopulated,
      req.token.id,
      NotificationService.NOTIFICATION_TYPES.CREATE,
      NotificationService.NOTIFICATION_ENTITIES.ORGANIZATION
    );

    return newOrganizationPopulated;
  },

  async deleteInSearch(organizationId) {
    await SearchService.deleteDocument('organizations', organizationId);
  },

  async updateInSearch(populatedOrganization) {
    // The remaining fields are spread into the search payload, so anything the
    // `organizations` collection schema doesn't declare must be destructured
    // out here. The document lists and their counts are display-only.
    const {
      names,
      cavers,
      country,
      exploredNetworks,
      exploredEntrances,
      partnerNetworks,
      partnerEntrances,
      authoredDocuments,
      publishedDocuments,
      authoredCount,
      publishedCount,
      ...o
    } = populatedOrganization;
    const organization = {
      ...o,
      authorId: o.author.id,
      author: o.author.nickname,
      reviewerId: o.reviewer?.id,
      reviewer: o.reviewer?.nickname,
      name: names?.[0]?.name,
      language: names?.[0]?.language,
      iso3166: o.iso_3166_2,
      country: [country?.id, country?.nativeName].filter((e) => e).join(' - '),
      nbCavers: cavers?.length ?? 0,
    };
    await SearchService.updateDocument('organizations', organization);
  },
};
