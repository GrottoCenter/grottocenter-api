const ramda = require('ramda');
const CaveService = require('./CaveService');
const ElasticsearchService = require('./ElasticsearchService');
const NameService = require('./NameService');
const NotificationService = require('./NotificationService');
const DescriptionService = require('./DescriptionService');
const GeocodingService = require('./GeocodingService');
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

  populateOrganization: async (organization) => {
    await CaveService.setEntrances(organization.exploredCaves);
    await CaveService.setEntrances(organization.partnerCaves);
    await NameService.setNames(organization.exploredCaves, 'cave');
    await NameService.setNames(organization.partnerCaves, 'cave');
    await NameService.setNames([organization], 'grotto');

    // Split caves between entrances and networks
    const exploredEntrances = [];
    const exploredNetworks = [];
    const partnerEntrances = [];
    const partnerNetworks = [];
    for (const cave of organization.exploredCaves) {
      if (cave.entrances.length > 1) {
        exploredNetworks.push(cave);
      }
      if (cave.entrances.length === 1) {
        exploredEntrances.push(cave.entrances.pop());
      }
    }
    for (const cave of organization.partnerCaves) {
      if (cave.entrances.length > 1) {
        partnerNetworks.push(cave);
      }
      if (cave.entrances.length === 1) {
        partnerEntrances.push(cave.entrances.pop());
      }
    }

    // Set Entrances names
    await NameService.setNames([exploredEntrances], 'entrance');
    await NameService.setNames([partnerEntrances], 'entrance');

    // Format organization
    /* eslint-disable no-param-reassign */
    delete organization.exploredCaves;
    delete organization.partnerCaves;
    organization.exploredEntrances = exploredEntrances;
    organization.exploredNetworks = exploredNetworks;
    organization.partnerEntrances = partnerEntrances;
    organization.partnerNetworks = partnerNetworks;
    /* eslint-enable no-param-reassign */

    // complete descriptions
    if (organization.documents && organization.documents.length > 0) {
      const promisesArray = [];
      for (const document of organization.documents) {
        promisesArray.push(
          DescriptionService.setDocumentDescriptions(document, false)
        );
      }
      await Promise.all(promisesArray);
    }
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

    const newOrganizationPopulated = await sails
      .getDatastore()
      .transaction(async (db) => {
        const caver = await TCaver.findOne(nameData.author).usingConnection(db);

        const newOrganization = await TGrotto.create(cleanedData)
          .fetch()
          .usingConnection(db);
        await TName.create({
          author: nameData.author,
          dateInscription: new Date(),
          grotto: newOrganization.id,
          isMain: true,
          language:
            ramda.propOr(null, 'language', nameData) !== null
              ? nameData.language
              : caver.language,
          name: nameData.text,
        })
          .fetch()
          .usingConnection(db);

        // Prepare data for Elasticsearch indexation
        const resPopulated = await TGrotto.findOne(newOrganization.id)
          .populate('country')
          .populate('names')
          .usingConnection(db);

        return resPopulated;
      });

    const { country, names, ...newOrganizationESData } =
      newOrganizationPopulated;

    await ElasticsearchService.create('grottos', newOrganizationPopulated.id, {
      ...newOrganizationESData,
      country: ramda.pathOr(
        null,
        ['country', 'nativeName'],
        newOrganizationPopulated
      ),
      'country code': ramda.pathOr(
        null,
        ['country', 'id'],
        newOrganizationPopulated
      ),
      name: names[0].name, // There is only one name right after the creation
      names: names.map((n) => n.name).join(', '),
      'nb cavers': 0,
      deleted: newOrganizationPopulated.isDeleted,
      tags: ['grotto'],
    });

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
