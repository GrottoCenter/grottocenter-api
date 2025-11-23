const should = require('should');
const RightService = require('../../../api/services/RightService');

describe('RightService', () => {
  describe('hasGroup()', () => {
    it('should return true when user has the group', () => {
      const userGroups = [{ name: 'Administrator' }, { name: 'Moderator' }];
      const result = RightService.hasGroup(
        userGroups,
        RightService.G.ADMINISTRATOR
      );
      should(result).be.true();
    });

    it('should return false when user does not have the group', () => {
      const userGroups = [{ name: 'Moderator' }];
      const result = RightService.hasGroup(
        userGroups,
        RightService.G.ADMINISTRATOR
      );
      should(result).be.false();
    });

    it('should return false when userGroups is not an array', () => {
      const result = RightService.hasGroup(null, RightService.G.ADMINISTRATOR);
      should(result).be.false();
    });

    it('should return false when userGroups is empty', () => {
      const result = RightService.hasGroup([], RightService.G.ADMINISTRATOR);
      should(result).be.false();
    });
  });
});
