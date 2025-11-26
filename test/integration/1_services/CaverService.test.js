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

    it('should create a non user caver with only name', async () => {
      const caverData = { name: 'OnlyName' };
      const newCaver = await CaverService.createNonUserCaver(caverData);
      should(newCaver.name).equal('OnlyName');
      should(newCaver.nickname).equal('OnlyName');
      await TCaver.destroyOne({ id: newCaver.id });
    });

    it('should create a non user caver with only surname', async () => {
      const caverData = { surname: 'OnlySurname' };
      const newCaver = await CaverService.createNonUserCaver(caverData);
      should(newCaver.surname).equal('OnlySurname');
      should(newCaver.nickname).equal('OnlySurname');
      await TCaver.destroyOne({ id: newCaver.id });
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
      should(caver.exploredNetworks.length).equal(1);
      should(caver.exploredNetworks[0].entrances.length).equal(2);
      should(caver.exploredNetworks[0].entrances).containDeep([
        { id: 4 },
        { id: 5 },
      ]);
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
      should(caver.type).equal('CAVER');
    });

    it('should return an author with type AUTHOR', async () => {
      const author = await CaverService.createNonUserCaver({
        nickname: 'TestAuthor',
        name: 'Test',
        surname: 'Author',
      });
      const result = await CaverService.getCaver(author.id);
      should(result.type).equal('AUTHOR');
      await TCaver.destroyOne({ id: author.id });
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

    it('should return null when email is null', async () => {
      const res = await CaverService.isARealCaver(null);
      should(res).be.null();
    });

    it('should return undefined when email is undefined', async () => {
      const res = await CaverService.isARealCaver(undefined);
      should(res).be.undefined();
    });

    it('should return empty string when email is empty string', async () => {
      const res = await CaverService.isARealCaver('');
      should(res).equal('');
    });
  });

  describe('countDistinctUsers()', () => {
    it('should return the count of real users', async () => {
      const count = await CaverService.countDistinctUsers();
      should(count).be.a.Number();
      should(count).be.greaterThan(0);
    });
  });

  describe('createNonUserCaver() - edge cases', () => {
    let createdCavers = [];

    afterEach(async () => {
      await Promise.all(
        createdCavers.map((caver) => TCaver.destroyOne({ id: caver.id }))
      );
      createdCavers = [];
    });

    it('should create caver with only name when nickname is empty', async () => {
      const caverData = { nickname: '', name: 'OnlyName' };
      const newCaver = await CaverService.createNonUserCaver(caverData);
      createdCavers.push(newCaver);
      should(newCaver.nickname).equal('OnlyName');
      should(newCaver.name).equal('OnlyName');
    });

    it('should create caver with only surname when nickname is empty', async () => {
      const caverData = { nickname: '', surname: 'OnlySurname' };
      const newCaver = await CaverService.createNonUserCaver(caverData);
      createdCavers.push(newCaver);
      should(newCaver.nickname).equal('OnlySurname');
      should(newCaver.surname).equal('OnlySurname');
    });

    it('should create caver with empty nickname when no data provided', async () => {
      const caverData = { nickname: '' };
      const newCaver = await CaverService.createNonUserCaver(caverData);
      createdCavers.push(newCaver);
      should(newCaver.nickname).equal('');
    });

    it('should create caver when caverData is null', async () => {
      const newCaver = await CaverService.createNonUserCaver(null);
      createdCavers.push(newCaver);
      should(newCaver.nickname).equal('');
    });

    it('should create caver when caverData is undefined', async () => {
      const newCaver = await CaverService.createNonUserCaver(undefined);
      createdCavers.push(newCaver);
      should(newCaver.nickname).equal('');
    });
  });

  describe('deleteInSearch()', () => {
    it('should call SearchService.deleteDocument', async () => {
      await CaverService.deleteInSearch(123);
    });
  });

  describe('updateInSearch()', () => {
    it('should call SearchService.updateDocument', async () => {
      const caver = {
        id: 1,
        dateInscription: new Date(),
        mail: 'test@test.com',
        name: 'Test',
        surname: 'User',
        nickname: 'TestUser',
      };
      await CaverService.updateInSearch(caver);
    });
  });
});
