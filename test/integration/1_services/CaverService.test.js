const should = require('should');
const AuthTokenService = require('../AuthTokenService');
const CaverService = require('../../../api/services/CaverService');

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
    const caver1Data = {
      name: 'Bob',
      nickname: 'Test_B0b_1',
      surname: 'Test1',
    };
    const caver2Data = {
      name: 'Bobby',
      surname: 'Test2',
    };

    it('should create a non user caver with a specified nickname and return it', async () => {
      const errorHandler = (e) => e;
      const newCaver = await CaverService.createNonUserCaver(
        caver1Data,
        errorHandler
      );
      should(newCaver.name).equal(caver1Data.name);
      should(newCaver.surname).equal(caver1Data.surname);
      should(newCaver.nickname).equal(caver1Data.nickname);
      should(newCaver.mail).containEql('@mail.no');
    });

    it('should create a non user caver and return it', async () => {
      const errorHandler = (e) => e;
      const newCaver = await CaverService.createNonUserCaver(
        caver2Data,
        errorHandler
      );
      should(newCaver.name).equal(caver2Data.name);
      should(newCaver.surname).equal(caver2Data.surname);
      should(newCaver.nickname).equal(
        `${caver2Data.name} ${caver2Data.surname}`
      );
      should(newCaver.mail).containEql('@mail.no');
    });

    after(async () => {
      const res1 = await TCaver.destroyOne(caver1Data);
      const res2 = await TCaver.destroyOne(caver2Data);
      should(res1).not.be.undefined();
      should(res2).not.be.undefined();
    });
  });

  describe('getCaver()', () => {
    const testCaver = (caver) => {
      should(caver.id).equal(6);
      should(caver.name).equal('Axel');
      should(caver.nickname).equal('Caver1');
      should(caver.surname).equal('Cavo');
      should(caver.documents.length).equal(3);
      should(caver.documents).containDeep([{ id: 1 }, { id: 2 }, { id: 4 }]);
      should(caver.groups.length).equal(1);
      should(caver.grottos.length).equal(2);
      should(caver.grottos).containDeep([{ id: 1 }, { id: 2 }]);
      should(caver.groups).containDeep([{ id: 1 }]);
      should(caver.exploredEntrances.length).equal(1);
      should(caver.exploredEntrances).containDeep([{ id: 4 }]);
      caver.exploredEntrances.forEach((entrance) => {
        should(entrance.isPublic).equal(true);
      });
      should(caver.language).equal('fra');
      should.not.exist(caver.password);
      should.not.exist(caver.activationCode);
    };

    it('should return undefined for a not existing caver', async () => {
      const caver = await CaverService.getCaver(123456789, userReq);
      should(caver).be.undefined();
    });

    it('should return a partial view of the caver when providing an user token', async () => {
      const caver = await CaverService.getCaver(6, userReq);
      should.not.exist(caver.mail);
      testCaver(caver);
    });

    it('should return a partial view of the caver when not providing a token', async () => {
      const caver = await CaverService.getCaver(6, {});
      should.not.exist(caver.mail);
      testCaver(caver);
    });

    it('should return a complete view of the caver when providing an admin token', async () => {
      const caver = await CaverService.getCaver(6, adminReq);
      testCaver(caver);
      should(caver.mail).equal('caver1@caver1.com');
      should.exist(caver.grottos);
      should.exist(caver.groups);
      should.exist(caver.relevance);
    });

    it('should return the mail if caver connected ask for his informations', async () => {
      const caver = await CaverService.getCaver(3, userReq);
      should(caver.mail).equal('user1@user1.com');
      //   testCaver(caver);
    });
    // Additional data
  });

  describe('isAuthor()', () => {
    it('should return true with the id of an author', async () => {
      const res = await CaverService.isAuthor(5);
      should(res).equal(true);
    });
    it('should return false with the id of a non-author', async () => {
      const res = await CaverService.isAuthor(6);
      should(res).equal(false);
    });
    it('should return false with an id which does not exist', async () => {
      const res = await CaverService.isAuthor(123456789);
      should(res).equal(false);
    });
  });
});
