const CaveService = require('./CaveService');
const DocumentService = require('./DocumentService');
const SearchService = require('./SearchService');
const NameService = require('./NameService');
const NotificationService = require('./NotificationService');
const GeocodingService = require('./GeocodingService');
const RecentChangeService = require('./RecentChangeService');
const coerceToNumeric = require('../utils/coerceToNumeric');

module.exports = {
  // Extract everything from a request body except id
  getConvertedDataFromClientRequest: (req) => ({
    address: req.param('address'),
    city: req.param('city'),
    country: req.body?.country?.id ?? null,
    county: req.param('county'),
    customMessage: req.param('customMessage'),
    latitude: coerceToNumeric(req.param('latitude')),
    longitude: coerceToNumeric(req.param('longitude')),
    mail: req.param('mail'),
    postalCode: req.param('postalCode'),
    region: req.param('region'),
    url: req.param('url'),
    yearBirth: req.param('yearBirth'),
  }),

  getPopulatedOrganization: async (organizationId) => {
    const organization = await TGrotto.findOne({ id: organizationId })
      .populate('author')
      .populate('reviewer')
      .populate('names')
      .populate('cavers')
      .populate('country')
      .populate('documents')
      .populate('exploredCaves')
      .populate('partnerCaves');

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

    // Get documents where organization is author (existing functionality)
    const authorDocIds = organization.documents.map((e) => e.id);

    // Get documents where organization is editor
    const editorDocs = await TDocument.find({ editor: organizationId });

    // Combine both sets of documents and remove duplicates
    const allDocIds = [
      ...new Set([...authorDocIds, ...editorDocs.map((d) => d.id)]),
    ];

    // Get Collection ancestors of all organization documents
    organization.documents =
      await DocumentService.getCollectionAncestors(allDocIds);

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

    if (cleanedData.latitude && cleanedData.longitude) {
      const address = await GeocodingService.reverse(
        cleanedData.latitude,
        cleanedData.longitude
      );
      // eslint-disable-next-line no-param-reassign
      if (address) cleanedData.iso_3166_2 = address.iso_3166_2;
    }

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

    await module.exports.updateInSearch(newOrganizationPopulated);

    await RecentChangeService.setNameCreate(
      'grotto',
      newOrganizationPopulated.id,
      req.token.id,
      nameData.text
    );

    await NotificationService.notifySubscribers(
      req,
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
    const {
      names,
      cavers,
      country,
      exploredNetworks,
      exploredEntrances,
      partnerNetworks,
      partnerEntrances,
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
