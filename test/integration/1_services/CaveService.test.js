const should = require('should');
const AuthTokenService = require('../AuthTokenService');
const CaveService = require('../../../api/services/CaveService');

const findAndPopulateCave = async (caveId) =>
  TCave.findOne(caveId)
    .populate('comments')
    .populate('descriptions')
    .populate('documents')
    .populate('entrances')
    .populate('exploringGrottos')
    .populate('histories')
    .populate('names')
    .populate('partneringGrottos');

describe('CaveService', () => {
  const userReq = {};
  before(async () => {
    userReq.token = await AuthTokenService.getUserToken();
  });

  describe('setEntrances()', () => {
    it('should set the cave entrances correctly', async () => {
      const cave1 = await TCave.findOne(1);
      const cave2 = await TCave.findOne(2);
      await CaveService.setEntrances([cave1, cave2]);

      should(cave1.entrances.length).equal(2);
      should(cave2.entrances.length).equal(1);
    });
  });

  describe('createCave()', () => {
    const caveData = {
      author: 1,
      isDiving: true,
      depth: 1234,
      latitude: 42.34,
      caveLength: 5678,
      longitude: 6.345676,
      temperature: 42,
    };

    const nameData = { name: 'TestCave1', language: 'eng' };
    const descriptionsData = [
      {
        author: 1,
        body: 'desc1',
        language: 'eng',
        title: 'titleDesc1',
      },
      {
        author: 1,
        body: 'desc2',
        language: 'fra',
        title: 'titreDesc2',
      },
    ];

    let nbCavesBefore;
    let nbCavesAfter;

    before(async () => {
      nbCavesBefore = (await TCave.find()).length;
    });

    it('should create a new cave', async () => {
      const createdCave = await CaveService.createCave(
        userReq,
        caveData,
        nameData,
        descriptionsData
      );

      // Cave data verifications
      should(createdCave.depth).equal(caveData.depth);
      should(createdCave.author.id).equal(caveData.author);
      should(createdCave.isDiving).equal(caveData.isDiving);
      should(parseFloat(createdCave.latitude)).equal(
        parseFloat(caveData.latitude)
      );
      should(createdCave.length).equal(caveData.length);
      should(parseFloat(createdCave.longitude)).equal(
        parseFloat(caveData.longitude)
      );
      should(createdCave.temperature).equal(caveData.temperature);

      const completeCreatedCave = await findAndPopulateCave(createdCave.id);
      const { names, descriptions } = completeCreatedCave;

      // Cave name verifications
      should(names.length).equal(1);
      should(names[0].name).equal(nameData.name);
      should(names[0].language).equal(nameData.language);
      // Cave descriptions verifications
      should(descriptions.length).equal(2);
      for (const initialDesc of descriptionsData) {
        const createdDesc = descriptions.find(
          (d) => d.title === initialDesc.title && d.body === initialDesc.body
        );
        should(createdDesc.author).equal(initialDesc.author);
        should(createdDesc.body).equal(initialDesc.body);
        should(createdDesc.language).equal(initialDesc.language);
        should(createdDesc.title).equal(initialDesc.title);
      }
    });

    after(async () => {
      // Test if a cave has been created
      nbCavesAfter = (await TCave.find()).length;
      should(nbCavesBefore).equal(nbCavesAfter - 1);

      // Reset state
      nbCavesBefore = undefined;
      nbCavesAfter = undefined;

      // Destroy created data
      await TCave.destroy(caveData);
      await TDescription.destroy({
        title: { in: descriptionsData.map((d) => d.title) },
      });
      await TName.destroy({ name: nameData.name });
    });
  });

  describe('getMassifs()', () => {
    it('should get the caves inside the geogPolygon of a massif', async () => {
      const massifs = await CaveService.getMassifs(3);
      should(massifs).containDeep([{ id: 1 }]);
    });
  });
});
