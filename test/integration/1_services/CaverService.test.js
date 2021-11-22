let should = require('should');
const AuthTokenService = require('../AuthTokenService');

describe('CaverService', () => {
  const userReq = {};
  const adminReq = {};
  before(async () => {
    sails.log.info('Asking for user token...');
    userReq.token = await AuthTokenService.getUserToken();
    sails.log.info('Asking for admin token...');
    adminReq.token = await AuthTokenService.getAdminToken();
  });

  describe('getGroups()', () => {
    it('should return all the caver groups', async () => {
      const groups = await CaverService.getGroups(4);

      groups.should.containDeep([
        {
          id: 1,
          name: 'Administrator',
        },
        {
          id: 2,
          name: 'Moderator',
        },
        {
          id: 3,
          name: 'User',
        },
        {
          id: 4,
          name: 'Visitor',
        },
        {
          id: 5,
          name: 'Leader',
        },
      ]);
    });
  });

  describe('createNonUserCaver()', () => {
    it('should create a non user caver with a specified nickname and return it', async () => {
      const caverData = {
        name: 'Bob',
        nickname: 'B0b_its_a_test',
        surname: 'Test',
      };

      const errorHandler = (e) => e;
      const newCaver = await CaverService.createNonUserCaver(
        caverData,
        errorHandler,
      );

      should(newCaver.name).equal(caverData.name);
      should(newCaver.surname).equal(caverData.surname);
      should(newCaver.nickname).equal(caverData.nickname);
      should(newCaver.mail).equal('no@mail.no');
    });
    it('should create a non user caver and return it', async () => {
      const caverData = {
        name: 'Bob',
        surname: 'Test',
      };

      const errorHandler = (e) => e;
      const newCaver = await CaverService.createNonUserCaver(
        caverData,
        errorHandler,
      );

      should(newCaver.name).equal(caverData.name);
      should(newCaver.surname).equal(caverData.surname);
      should(newCaver.nickname).equal(caverData.name + ' ' + caverData.surname);
      should(newCaver.mail).equal('no@mail.no');
    });
  });

  describe('getCaver()', () => {
    it('should return undefined for a not existing caver', async () => {
      const caver = await CaverService.getCaver(123456789, userReq);
      should(caver).equal(undefined);
    });
    it('should return a partial view of the caver when providing an user token', async () => {
      const caver = await CaverService.getCaver(1, userReq);
      should(caver.name).equal('Adrien');
      should(caver.nickname).equal('Admin1');
      should(caver.surname).equal('Admo');
      should(caver.documents.length).equal(3);
      should(caver.documents).containDeep([{ id: 1 }, { id: 2 }, { id: 4 }]);
      should.not.exist(caver.password);
      should.not.exist(caver.activationCode);
    });
    it('should return a partial view of the caver when not providing a token', async () => {
      const caver = await CaverService.getCaver(1, {});
      should(caver.name).equal('Adrien');
      should(caver.nickname).equal('Admin1');
      should(caver.surname).equal('Admo');
      should(caver.documents.length).equal(3);
      should(caver.documents).containDeep([{ id: 1 }, { id: 2 }, { id: 4 }]);
      should.not.exist(caver.password);
      should.not.exist(caver.activationCode);
    });
    it('should return a complete view of the caver', async () => {
      const caver = await CaverService.getCaver(1, adminReq);
      sails.log.debug(caver);
      should(caver.name).equal('Adrien');
      should(caver.nickname).equal('Admin1');
      should(caver.surname).equal('Admo');
      should(caver.documents.length).equal(3);
      should(caver.documents).containDeep([{ id: 1 }, { id: 2 }, { id: 4 }]);
      should.not.exist(caver.password);
      should.not.exist(caver.activationCode);

      // Additional data
      should.exist(caver.relevance);
      should(caver.mail).equal('admin1@admin1.com');
      should.exist(caver.grottos);
      should.exist(caver.groups);
    });
  });
});
