const { initial } = require('lodash');
let should = require('should');

describe('CaveService', () => {
  describe('setEntrances()', () => {
    it('should set the cave entrances correctly', async () => {
      const cave1 = await TCave.findOne(1);
      const cave2 = await TCave.findOne(2);
      await CaveService.setEntrances([cave1, cave2]);

      should(cave1.entrances.length).equal(2);
      should(cave2.entrances.length).equal(1);
    });
  });

  describe('create()', () => {
    let nbCavesBefore, nbCavesAfter;

    beforeEach(async () => {
      nbCavesBefore = (await TCave.find()).length;
    });

    afterEach(async () => {
      // Test if a cave has been created
      nbCavesAfter = (await TCave.find()).length;
      should(nbCavesBefore).equal(nbCavesAfter - 1);

      // Reset state
      nbCavesBefore = undefined;
      nbCavesAfter = undefined;
      await TCave.destroy({ length: 1234, depth: 5678 }); // using depth and length for deleting is not perfect but reduce the risk to delete something else than what we created just before
    });

    it('should create a new cave', async () => {
      /* eslint-disable camelcase */
      const caveData = {
        id_author: 1,
        is_diving: true,
        depth: 1234,
        length: 5678,
        temperature: 42,
      };
      /* eslint-enable camelcase */
      const nameData = { name: 'TestCave1', language: 'eng' };
      const descriptionsData = [
        { author: 1, body: 'desc1', language: 'eng', title: 'titleDesc1' },
        { author: 1, body: 'desc2', language: 'fra', title: 'titreDesc2' },
      ];
      const createdCave = await CaveService.createCave(
        caveData,
        nameData,
        descriptionsData,
      );

      // Cave data verifications
      should(createdCave.depth).equal(caveData.depth);
      should(createdCave.id_author).equal(caveData.id_author);
      should(createdCave.is_diving).equal(caveData.is_diving);
      should(createdCave.length).equal(caveData.length);
      should(createdCave.temperature).equal(caveData.temperature);

      const completeCreatedCave = await TCave.findOne(createdCave.id)
        .populate('descriptions')
        .populate('names');
      const { names, descriptions } = completeCreatedCave;

      // Cave name verifications
      should(names.length).equal(1);
      should(names[0].name).equal(nameData.name);
      should(names[0].language).equal(nameData.language);
      // Cave descriptions verifications
      should(descriptions.length).equal(2);
      for (const initialDesc of descriptionsData) {
        const createdDesc = descriptions.find(
          (d) => d.title === initialDesc.title && d.body === initialDesc.body,
        );
        should(createdDesc.author).equal(initialDesc.author);
        should(createdDesc.body).equal(initialDesc.body);
        should(createdDesc.language).equal(initialDesc.language);
        should(createdDesc.title).equal(initialDesc.title);
      }
    });
  });
});
