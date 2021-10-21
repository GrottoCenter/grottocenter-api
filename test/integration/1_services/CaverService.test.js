let should = require('should');

describe('CaverService', () => {
  describe('getGroups()', () => {
    it('should return the groups of user with id=4 (all groups --> 5)', async () => {
      const groups = await CaverService.getGroups(4);
      should(groups.length).equal(5);
    });
    it('should return the groups of user with id=1 (1)', async () => {
      const groups = await CaverService.getGroups(1);
      should(groups.length).equal(1);
    });
  });

  describe('getCaver() without complete view right', () => {
    it('should return a partial view of the caver with id=1', async () => {
      const caver = await CaverService.getCaver(1, {});
      should(caver.name).equal('Ad');
      should(caver.surname).equal('Min');
      should(caver.nickname).equal('Admin1');
      should.not.exist(caver.mail);
      should.not.exist(caver.password);
    });
    it('should return undefined if caver is not found', async () => {
      const caver = await CaverService.getCaver(42, {});
      should.not.exist(caver);
    });
  });
});
