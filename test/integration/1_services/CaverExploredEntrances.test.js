const should = require('should');

describe('Caver explored entrances relationship', () => {
  let testCaver;
  let testCave;
  let testEntrance;

  before(async () => {
    testCaver = await TCaver.create({
      dateInscription: new Date(),
      mail: `test-svc-${Date.now()}@test.com`,
      nickname: 'Test Service Caver',
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

    // Link caver to entrance
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
    if (testEntrance) await TEntrance.destroyOne({ id: testEntrance.id });
    if (testCave) await TCave.destroyOne({ id: testCave.id });
    if (testCaver) await TCaver.destroyOne({ id: testCaver.id });
  });

  describe('CaverService.getCaver()', () => {
    it('should return exploredEntrances from junction table', async () => {
      // eslint-disable-next-line global-require
      const CaverService = require('../../../api/services/CaverService');
      const caver = await CaverService.getCaver(testCaver.id);

      should(caver).have.property('exploredEntrances');
      should(caver.exploredEntrances).be.an.Array();
      should(caver.exploredEntrances).have.length(1);
      should(caver.exploredEntrances[0].id).equal(testEntrance.id);
    });

    it('should NOT have exploredCaves or exploredNetworks properties', async () => {
      // eslint-disable-next-line global-require
      const CaverService = require('../../../api/services/CaverService');
      const caver = await CaverService.getCaver(testCaver.id);

      should(caver).not.have.property('exploredCaves');
      should(caver).not.have.property('exploredNetworks');
    });

    it('should set names on explored entrances', async () => {
      // eslint-disable-next-line global-require
      const CaverService = require('../../../api/services/CaverService');
      const caver = await CaverService.getCaver(testCaver.id);

      caver.exploredEntrances.forEach((entrance) => {
        should(entrance).have.property('names');
      });
    });
  });
});
