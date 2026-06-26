const should = require('should');

describe('JCaverEntranceExplorer model associations', () => {
  let testCaver;
  let testCave;
  let testEntrance;

  before(async () => {
    testCaver = await TCaver.create({
      dateInscription: new Date(),
      mail: `test-explorer-${Date.now()}@test.com`,
      nickname: 'Explorer Test',
      language: '000',
    }).fetch();

    testCave = await TCave.create({
      author: 1,
      dateInscription: new Date(),
      dateReviewed: new Date(),
    }).fetch();

    testEntrance = await TEntrance.create({
      author: 1,
      dateInscription: new Date(),
      latitude: '45.5',
      longitude: '6.5',
      cave: testCave.id,
      geology: 'Q35758',
    }).fetch();
  });

  after(async () => {
    // Clear any lingering junction rows first (idempotent — safe if already gone)
    if (testCaver && testEntrance) {
      await TCaver.removeFromCollection(
        testCaver.id,
        'exploredEntrances',
        testEntrance.id
      );
    }
    if (testEntrance) await TEntrance.destroyOne({ id: testEntrance.id });
    if (testCave) await TCave.destroyOne({ id: testCave.id });
    if (testCaver) await TCaver.destroyOne({ id: testCaver.id });
  });

  describe('TCaver.populate(exploredEntrances)', () => {
    before(async () => {
      await TCaver.addToCollection(
        testCaver.id,
        'exploredEntrances',
        testEntrance.id
      );
    });

    after(async () => {
      await TCaver.removeFromCollection(
        testCaver.id,
        'exploredEntrances',
        testEntrance.id
      );
    });

    it('should return entrance objects when populated', async () => {
      const caver = await TCaver.findOne(testCaver.id).populate(
        'exploredEntrances'
      );
      should(caver.exploredEntrances).be.an.Array();
      should(caver.exploredEntrances).have.length(1);
      should(caver.exploredEntrances[0].id).equal(testEntrance.id);
    });
  });

  describe('TEntrance.populate(explorerCavers)', () => {
    before(async () => {
      await TCaver.addToCollection(
        testCaver.id,
        'exploredEntrances',
        testEntrance.id
      );
    });

    after(async () => {
      await TCaver.removeFromCollection(
        testCaver.id,
        'exploredEntrances',
        testEntrance.id
      );
    });

    it('should return caver objects when populated', async () => {
      const entrance = await TEntrance.findOne(testEntrance.id).populate(
        'explorerCavers'
      );
      should(entrance.explorerCavers).be.an.Array();
      should(entrance.explorerCavers).have.length(1);
      should(entrance.explorerCavers[0].id).equal(testCaver.id);
    });
  });

  describe('Collection add/remove', () => {
    it('should add and remove via Waterline collection methods', async () => {
      await TCaver.addToCollection(
        testCaver.id,
        'exploredEntrances',
        testEntrance.id
      );

      let caver = await TCaver.findOne(testCaver.id).populate(
        'exploredEntrances'
      );
      should(caver.exploredEntrances).have.length(1);

      await TCaver.removeFromCollection(
        testCaver.id,
        'exploredEntrances',
        testEntrance.id
      );

      caver = await TCaver.findOne(testCaver.id).populate('exploredEntrances');
      should(caver.exploredEntrances).have.length(0);
    });
  });
});
