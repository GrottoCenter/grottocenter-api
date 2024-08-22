const ramda = require('ramda');
const CaveService = require('./CaveService');
const DocumentService = require('./DocumentService');
const ElasticsearchService = require('./ElasticsearchService');
const NameService = require('./NameService');
const NotificationService = require('./NotificationService');
const GeocodingService = require('./GeocodingService');
const RecentChangeService = require('./RecentChangeService');

const {
  NOTIFICATION_ENTITIES,
  NOTIFICATION_TYPES,
} = require('./NotificationService');

module.exports = {
  // Extract everything from a request body except id
  getConvertedDataFromClientRequest: (req) => ({
    address: req.param('address'),
    city: req.param('city'),
    country: ramda.pathOr(null, ['country', 'id'], req.body),
    county: req.param('county'),
    customMessage: req.param('customMessage'),
    latitude: req.param('latitude'),
    longitude: req.param('longitude'),
    mail: req.param('mail'),
    postalCode: req.param('postalCode'),
    region: req.param('region'),
    url: req.param('url'),
    yearBirth: req.param('yearBirth'),
  }),

  getPopulatedOrganization: async (organizationId) => {
    const organization = await TGrotto.findOne(organizationId)
      .populate('author')
      .populate('reviewer')
      .populate('names')
      .populate('cavers')
      .populate('documents')
      .populate('exploredCaves')
      .populate('partnerCaves');

    if (!organization) return null;
    if (organization.isDeleted) return organization;

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
    organization.documents = await DocumentService.getDocuments(
      organization.documents.map((e) => e.id)
    );
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
    const { country, names, ...newOrganizationESData } =
      newOrganizationPopulated;

    await ElasticsearchService.create('grottos', newOrganizationPopulated.id, {
      ...newOrganizationESData,
      country: newOrganizationPopulated?.country?.nativeName ?? null,
      'country code': newOrganizationPopulated?.country?.id ?? null,
      name: names[0].name, // There is only one name right after the creation
      names: names.map((n) => n.name).join(', '),
      'nb cavers': 0,
      deleted: newOrganizationPopulated.isDeleted,
      tags: ['grotto'],
    });

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
      NOTIFICATION_TYPES.CREATE,
      NOTIFICATION_ENTITIES.ORGANIZATION
    );

    return newOrganizationPopulated;
  },
};
