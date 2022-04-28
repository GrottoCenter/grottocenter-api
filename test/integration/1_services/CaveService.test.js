const should = require('should');
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
    const caveData = {
      id_author: 1,
      is_diving: true,
      depth: 1234,
      latitude: 42.34,
      length: 5678,
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
        caveData,
        nameData,
        descriptionsData
      );

      // Cave data verifications
      should(createdCave.depth).equal(caveData.depth);
      should(createdCave.id_author).equal(caveData.id_author);
      should(createdCave.is_diving).equal(caveData.is_diving);
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

  describe('mergeCaves()', () => {
    const cave1Data = {
      id_author: 1,
      is_diving: false,
      depth: 1234,
      exploringGrottos: [1, 2],
      partneringGrottos: [1],
      latitude: 2.75688,
      length: 5678,
      longitude: 32.45688,
      temperature: 42,
    };

    const name1Data = { name: 'TestCave1', language: 'eng' };
    const descriptions1Data = [
      {
        author: 1,
        body: 'desc1 cave1',
        language: 'eng',
        title: 'titleDesc1 cave1',
      },
      {
        author: 1,
        body: 'desc2 cave1',
        language: 'fra',
        title: 'titreDesc2 cave1',
      },
    ];

    const cave2Data = {
      id_author: 2,
      is_diving: true,
      depth: 12,
      exploringGrottos: [1, 3],
      partneringGrottos: [2, 3],
      latitude: 5.23658,
      length: 34,
      longitude: 45.658,
      temperature: null,
    };

    const name2Data = { name: 'TestCave2', language: 'eng' };
    const descriptions2Data = [
      {
        author: 2,
        body: 'desc1 cave2',
        language: 'eng',
        title: 'titleDesc1 - cave2',
      },
      {
        author: 2,
        body: 'desc2 cave2',
        language: 'fra',
        title: 'titreDesc2 - cave2',
      },
    ];

    it('should merge two caves into one', async () => {
      const cave1Tmp = await CaveService.createCave(
        cave1Data,
        name1Data,
        descriptions1Data
      );
      const cave2Tmp = await CaveService.createCave(
        cave2Data,
        name2Data,
        descriptions2Data
      );
      const oldCave1 = await findAndPopulateCave(cave1Tmp.id);
      const oldCave2 = await findAndPopulateCave(cave2Tmp.id);

      await CaveService.mergeCaves(oldCave1.id, oldCave2.id);

      // Verifications (cave2 (destination) data overwrite cave1 data (source))
      const resultCave = await findAndPopulateCave(oldCave2.id);

      // Only the destination cave data are preserved...
      // ...except if not present initially (temperature here) !
      should(resultCave.author).equal(oldCave2.author);
      should(resultCave.depth).equal(oldCave2.depth);
      should(resultCave.isDiving).equal(oldCave2.isDiving);
      should(parseFloat(resultCave.latitude)).equal(
        parseFloat(oldCave2.latitude)
      );
      should(resultCave.length).equal(oldCave2.length);
      should(parseFloat(resultCave.longitude)).equal(
        parseFloat(oldCave2.longitude)
      );
      should(resultCave.temperature).equal(oldCave1.temperature);

      // Comment, descriptions and histories are merged, without duplicate check
      // because each of them are unique
      const collectionNamesToCheck = ['comments', 'descriptions', 'histories'];
      for (const collectionName of collectionNamesToCheck) {
        should(resultCave[collectionName].length).equal(
          oldCave2[collectionName].length + oldCave1[collectionName].length
        );
      }

      // Only the destination cave names are preserved
      should(resultCave.names.length).equal(oldCave2.names.length);

      // For documents, entrances, exploringGrottos, partneringGrottos,
      // there are no duplicate (thus, the use of Set())
      const collectionNamesWithoutDuplicates = [
        'documents',
        'entrances',
        'exploringGrottos',
        'partneringGrottos',
      ];
      for (const collectionName of collectionNamesWithoutDuplicates) {
        const oldValuesConcateneted = oldCave1[collectionName].concat(
          oldCave2[collectionName]
        );
        const oldUniqueValues = oldValuesConcateneted.filter(
          (value, idx, array) =>
            array.findIndex((t) => t.id === value.id) === idx
        );
        should(resultCave[collectionName]).deepEqual(oldUniqueValues);
      }
    });

    after(async () => {
      const {
        exploringGrottos: expG1,
        partneringGrottos: parG1,
        ...cleanedCave1Data
      } = cave1Data;
      const {
        exploringGrottos: expG2,
        partneringGrottos: parG2,
        ...cleanedCave2Data
      } = cave2Data;
      // Destroy created data
      await TCave.destroyOne({
        depth: cleanedCave1Data.depth,
        length: cleanedCave1Data.length,
      });
      await TCave.destroyOne({
        depth: cleanedCave2Data.depth,
        length: cleanedCave2Data.length,
      });
      await TDescription.destroy({
        title: { in: descriptions1Data.map((d) => d.title) },
      });
      await TDescription.destroy({
        title: { in: descriptions2Data.map((d) => d.title) },
      });
      await TName.destroy({ name: name1Data.name });
      await TName.destroy({ name: name2Data.name });
    });
  });

  describe('getMassif', () => {
    it('should get the caves inside the geogPolygon of a massif', async () => {
      const caves = await CaveService.getMassifs({ id: 3 });
      should(caves.length).equal(1);
      should(caves).containDeep([{ id: 1 }]);
    });
  });
});
