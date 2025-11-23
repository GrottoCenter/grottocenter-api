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

    it('should return empty array when cave has no coordinates', async () => {
      const massifs = await CaveService.getMassifs(999999);
      should(massifs).be.an.Array();
      should(massifs.length).equal(0);
    });
  });

  describe('getConvertedDataFromClient()', () => {
    it('should extract cave data from request', () => {
      const req = {
        param: (key) => {
          const data = {
            depth: 100,
            documents: [1, 2],
            isDiving: true,
            latitude: 45.5,
            longitude: 6.5,
            length: 500,
            massif: 1,
            temperature: 12,
          };
          return data[key];
        },
      };

      const result = CaveService.getConvertedDataFromClient(req);
      should(result.depth).equal(100);
      should(result.documents).eql([1, 2]);
      should(result.isDiving).equal(true);
      should(result.latitude).equal(45.5);
      should(result.longitude).equal(6.5);
      should(result.caveLength).equal(500);
      should(result.massif).equal(1);
      should(result.temperature).equal(12);
    });
  });

  describe('getCumulatedLength()', () => {
    it('should return cumulated length and count', async () => {
      const result = await CaveService.getCumulatedLength();
      should.exist(result);
      should(result).have.property('sum_length');
      should(result).have.property('nb_data');
    });
  });

  describe('getPopulatedCave()', () => {
    it('should return null for non-existent cave', async () => {
      const cave = await CaveService.getPopulatedCave(999999);
      should(cave).be.null();
    });

    it('should return populated cave with all relations', async () => {
      const cave = await CaveService.getPopulatedCave(1);
      should.exist(cave);
      should.exist(cave.author);
      should.exist(cave.names);
      should.exist(cave.entrances);
      should.exist(cave.massifs);
    });

    it('should handle cave with no names', async () => {
      const caveData = {
        author: 1,
        depth: 50,
        latitude: 45.0,
        longitude: 6.0,
      };
      const createdCave = await TCave.create(caveData).fetch();

      const cave = await CaveService.getPopulatedCave(createdCave.id);
      should.exist(cave);

      await TCave.destroyOne({ id: createdCave.id });
    });
  });

  describe('deleteInSearch()', () => {
    it('should call SearchService.deleteDocument', async () => {
      await CaveService.deleteInSearch(1);
    });
  });

  describe('updateInSearch()', () => {
    it('should call SearchService.updateDocument', async () => {
      const populatedCave = await CaveService.getPopulatedCave(1);
      await CaveService.updateInSearch(populatedCave);
    });
  });

  describe('createCave() - without descriptions', () => {
    let createdCaveId;

    it('should create cave without descriptions', async () => {
      const caveData = { author: 1, depth: 100 };
      const nameData = { name: 'TestCaveNoDesc', language: 'eng' };

      const cave = await CaveService.createCave(userReq, caveData, nameData);
      createdCaveId = cave.id;

      should.exist(cave);
      should(cave.names.length).equal(1);
    });

    after(async () => {
      if (createdCaveId) {
        await TName.destroy({ cave: createdCaveId });
        await TCave.destroyOne({ id: createdCaveId });
      }
    });
  });

  describe('permanentlyDeleteCave()', () => {
    let testCave1;
    let testCave2;

    beforeEach(async () => {
      testCave1 = await TCave.create({ author: 1, depth: 50 }).fetch();
      await TName.create({
        cave: testCave1.id,
        name: 'TestCave1',
        language: 'eng',
        isMain: true,
      });

      testCave2 = await TCave.create({ author: 1, depth: 60 }).fetch();
      await TName.create({
        cave: testCave2.id,
        name: 'TestCave2',
        language: 'eng',
        isMain: true,
      });
    });

    afterEach(async () => {
      if (testCave1) {
        await TName.destroy({ cave: testCave1.id });
        await TCave.destroyOne({ id: testCave1.id }).tolerate('E_UNIQUE');
      }
      if (testCave2) {
        await TName.destroy({ cave: testCave2.id });
        await TCave.destroyOne({ id: testCave2.id }).tolerate('E_UNIQUE');
      }
    });

    it('should permanently delete cave without merge', async () => {
      const cave = await CaveService.getPopulatedCave(testCave1.id);
      await CaveService.permanentlyDeleteCave(cave, false, null);

      const deletedCave = await TCave.findOne({ id: testCave1.id });
      should(deletedCave).be.undefined();
    });

    it('should permanently delete cave with merge into another', async () => {
      const cave = await CaveService.getPopulatedCave(testCave1.id);
      await CaveService.permanentlyDeleteCave(cave, true, testCave2.id);

      const deletedCave = await TCave.findOne({ id: testCave1.id });
      should(deletedCave).be.undefined();
    });

    it('should handle cave with documents when merging', async () => {
      const doc = await TDocument.create({ author: 1, type: 1 }).fetch();
      await TCave.addToCollection(testCave1.id, 'documents', [doc.id]);

      const cave = await CaveService.getPopulatedCave(testCave1.id);
      await CaveService.permanentlyDeleteCave(cave, true, testCave2.id);

      const targetCave = await TCave.findOne(testCave2.id).populate(
        'documents'
      );
      should(targetCave.documents.map((d) => d.id)).containEql(doc.id);

      await TDocument.destroyOne({ id: doc.id });
    });

    it('should handle cave with documents without merge', async () => {
      const doc = await TDocument.create({ author: 1, type: 1 }).fetch();
      await TCave.addToCollection(testCave1.id, 'documents', [doc.id]);

      const cave = await CaveService.getPopulatedCave(testCave1.id);
      await CaveService.permanentlyDeleteCave(cave, false, null);

      const updatedDoc = await TDocument.findOne({ id: doc.id });
      should(updatedDoc.cave).be.null();

      await TDocument.destroyOne({ id: doc.id });
    });

    it('should handle cave with entrances when merging', async () => {
      const entrance = await TEntrance.create({
        author: 1,
        cave: testCave1.id,
        latitude: 45.0,
        longitude: 6.0,
      }).fetch();
      await TName.create({
        entrance: entrance.id,
        name: 'TestEntrance',
        language: 'eng',
        isMain: true,
      });

      const cave = await CaveService.getPopulatedCave(testCave1.id);
      await CaveService.permanentlyDeleteCave(cave, true, testCave2.id);

      const targetCave = await TCave.findOne(testCave2.id).populate(
        'entrances'
      );
      should(targetCave.entrances.map((e) => e.id)).containEql(entrance.id);

      await TName.destroy({ entrance: entrance.id });
      await TEntrance.destroyOne({ id: entrance.id });
    });

    it('should handle cave with descriptions when merging', async () => {
      const desc = await TDescription.create({
        author: 1,
        cave: testCave1.id,
        body: 'Test description',
        language: 'eng',
      }).fetch();

      const cave = await CaveService.getPopulatedCave(testCave1.id);
      await CaveService.permanentlyDeleteCave(cave, true, testCave2.id);

      const movedDesc = await TDescription.findOne({ id: desc.id });
      should(movedDesc.cave).equal(testCave2.id);

      await TDescription.destroyOne({ id: desc.id });
    });

    it('should handle cave with descriptions without merge', async () => {
      const desc = await TDescription.create({
        author: 1,
        cave: testCave1.id,
        body: 'Test description',
        language: 'eng',
      }).fetch();

      const cave = await CaveService.getPopulatedCave(testCave1.id);
      await CaveService.permanentlyDeleteCave(cave, false, null);

      const deletedDesc = await TDescription.findOne({ id: desc.id });
      should(deletedDesc).be.undefined();
    });

    it('should handle cave with redirectTo references', async () => {
      const cave3 = await TCave.create({
        author: 1,
        depth: 70,
        redirectTo: testCave1.id,
      }).fetch();

      const cave = await CaveService.getPopulatedCave(testCave1.id);
      await CaveService.permanentlyDeleteCave(cave, true, testCave2.id);

      const updatedCave3 = await TCave.findOne({ id: cave3.id });
      should(updatedCave3.redirectTo).equal(testCave2.id);

      await TCave.destroyOne({ id: cave3.id });
    });
  });
});
