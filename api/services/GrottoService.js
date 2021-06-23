const ramda = require('ramda');

module.exports = {
    createGrotto: async (cleanedData, nameData, errorHandler, esClient) => {
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
      })
      .intercept(errorHandler);

    const {
      country,
      names,
      ...newOrganizationESData
    } = newOrganizationPopulated;
        
        try {
            esClient.create({
              index: `grottos-index`,
              type: 'data',
              id: newOrganizationPopulated.id,
              body: {
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
                type: 'grotto',
              },
            });
          } catch (error) {
            sails.log.error(error);
          }
          return newOrganizationPopulated;
    }
}