const ramda = require('ramda');

module.exports = {
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
    delete organization.exploredCaves;
    delete organization.partnerCaves;
    organization.exploredEntrances = exploredEntrances;
    organization.exploredNetworks = exploredNetworks;
    organization.partnerEntrances = partnerEntrances;
    organization.partnerNetworks = partnerNetworks;
  },
  /**
   *
   * @param {*} cleanedData
   * @param {*} nameData
   * @throws Sails ORM errors (see https://sailsjs.com/documentation/concepts/models-and-orm/errors)
   * @returns
   */
  createGrotto: async (cleanedData, nameData) => {
    const newOrganizationPopulated = await sails
      .getDatastore()
      .transaction(async (db) => {
        const caver = await TCaver.findOne(nameData.author).usingConnection(db);

        const newOrganization = await TGrotto.create(cleanedData)
          .fetch()
          .usingConnection(db);
        const name = await TName.create({
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
        const newOrganizationPopulated = await TGrotto.findOne(
          newOrganization.id,
        )
          .populate('country')
          .populate('names')
          .usingConnection(db);

        return newOrganizationPopulated;
      });

    const {
      country,
      names,
      ...newOrganizationESData
    } = newOrganizationPopulated;

    await ElasticsearchService.create('grottos', newOrganizationPopulated.id, {
      ...newOrganizationESData,
      country: ramda.pathOr(
        null,
        ['country', 'nativeName'],
        newOrganizationPopulated,
      ),
      'country code': ramda.pathOr(
        null,
        ['country', 'id'],
        newOrganizationPopulated,
      ),
      name: names[0].name, // There is only one name right after the creation
      names: names.map((n) => n.name).join(', '),
      'nb cavers': 0,
      tags: ['grotto'],
    });

    return newOrganizationPopulated;
  },
};
