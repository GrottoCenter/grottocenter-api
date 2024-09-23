const should = require('should');
const AuthTokenService = require('../AuthTokenService');
const CaverService = require('../../../api/services/CaverService');

describe('CaverService', () => {
  const userReq = {};
  const adminReq = {};
  before(async () => {
    userReq.token = await AuthTokenService.getUserToken();
    adminReq.token = await AuthTokenService.getAdminToken();
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

    it('should return null for a not existing caver', async () => {
      const caver = await CaverService.getCaver(123456789);
      should(caver).be.null();
    });

    it('should return a view of the caver', async () => {
      const caver = await CaverService.getCaver(6);
      testCaver(caver);
      should.exist(caver.grottos);
      should.exist(caver.groups);
    });
  });

  describe('isARealCaver()', () => {
    it('should return true with the id of an author', async () => {
      const res = await CaverService.isARealCaver('Caver@test.com');
      should(res).equal(true);
    });
    it('should return false with the id of a non-author', async () => {
      const res = await CaverService.isARealCaver('author@MAIL.no');
      should(res).equal(false);
    });
  });
});
