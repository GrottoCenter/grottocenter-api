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
});
