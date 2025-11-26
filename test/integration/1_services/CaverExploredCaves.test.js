const should = require('should');

describe('Caver explored caves relationship', () => {
  let testCaver;
  let testCave1; // Single entrance cave
  let testCave2; // Multi-entrance cave (network)
  let testEntrance1;
  let testEntrance2;
  let testEntrance3;

  before(async () => {
    // Create test caver
    testCaver = await TCaver.create({
      dateInscription: new Date(),
      mail: `test-${Date.now()}@test.com`,
      nickname: 'Test Caver',
      language: '000',
    }).fetch();

    // Create cave with single entrance
    testCave1 = await TCave.create({
      author: 1,
      dateInscription: new Date(),
      dateReviewed: new Date(),
    }).fetch();

    testEntrance1 = await TEntrance.create({
      author: 1,
      dateInscription: new Date(),
      latitude: '45.5',
      longitude: '6.5',
      cave: testCave1.id,
      geology: 'Q35758',
    }).fetch();

    // Create cave with multiple entrances (network)
    testCave2 = await TCave.create({
      author: 1,
      dateInscription: new Date(),
      dateReviewed: new Date(),
    }).fetch();

    testEntrance2 = await TEntrance.create({
      author: 1,
      dateInscription: new Date(),
      latitude: '45.6',
      longitude: '6.6',
      cave: testCave2.id,
      geology: 'Q35758',
    }).fetch();

    testEntrance3 = await TEntrance.create({
      author: 1,
      dateInscription: new Date(),
      latitude: '45.7',
      longitude: '6.7',
      cave: testCave2.id,
      geology: 'Q35758',
    }).fetch();
  });

  after(async () => {
    // Cleanup
    if (testEntrance1) await TEntrance.destroyOne({ id: testEntrance1.id });
    if (testEntrance2) await TEntrance.destroyOne({ id: testEntrance2.id });
    if (testEntrance3) await TEntrance.destroyOne({ id: testEntrance3.id });
    if (testCave1) await TCave.destroyOne({ id: testCave1.id });
    if (testCave2) await TCave.destroyOne({ id: testCave2.id });
    if (testCaver) await TCaver.destroyOne({ id: testCaver.id });
  });

  describe('Junction table j_caver_cave_explorer', () => {
    it('should link caver to cave', async () => {
      await TCaver.addToCollection(testCaver.id, 'exploredCaves', testCave1.id);

      const caver = await TCaver.findOne(testCaver.id).populate(
        'exploredCaves'
      );
      should(caver.exploredCaves).have.length(1);
      should(caver.exploredCaves[0].id).equal(testCave1.id);
    });

    it('should remove caver-cave link', async () => {
      await TCaver.removeFromCollection(
        testCaver.id,
        'exploredCaves',
        testCave1.id
      );

      const caver = await TCaver.findOne(testCaver.id).populate(
        'exploredCaves'
      );
      should(caver.exploredCaves).have.length(0);
    });
  });

  describe('CaverService.getCaver()', () => {
    before(async () => {
      // Add both caves to the caver
      await TCaver.addToCollection(testCaver.id, 'exploredCaves', [
        testCave1.id,
        testCave2.id,
      ]);
    });

    it('should split caves into exploredEntrances and exploredNetworks', async () => {
      // eslint-disable-next-line global-require
      const CaverService = require('../../../api/services/CaverService');
      const caver = await CaverService.getCaver(testCaver.id);

      should(caver).have.property('exploredEntrances');
      should(caver).have.property('exploredNetworks');
      should(caver).not.have.property('exploredCaves');

      // Cave with 1 entrance should be in exploredEntrances
      should(caver.exploredEntrances).have.length(1);
      should(caver.exploredEntrances[0].id).equal(testEntrance1.id);

      // Cave with 2+ entrances should be in exploredNetworks
      should(caver.exploredNetworks).have.length(1);
      should(caver.exploredNetworks[0].id).equal(testCave2.id);
      should(caver.exploredNetworks[0].entrances).have.length(2);
    });

    it('should set names for entrances and networks', async () => {
      // eslint-disable-next-line global-require
      const CaverService = require('../../../api/services/CaverService');
      const caver = await CaverService.getCaver(testCaver.id);

      // Check that names are set (even if empty array)
      caver.exploredEntrances.forEach((entrance) => {
        should(entrance).have.property('names');
      });

      caver.exploredNetworks.forEach((network) => {
        should(network).have.property('names');
      });
    });
  });
});
