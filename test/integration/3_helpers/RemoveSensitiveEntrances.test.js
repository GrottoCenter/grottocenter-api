const should = require('should');
const AuthTokenService = require('../AuthTokenService');
const { sensitiveEntrancesTestData } = require('./FAKE_DATA');

describe('RemoveSensitiveEntrances helper', () => {
  const adminReq = {};
  const userReq = {};
  const visitorReq = {};
  let removeSensitiveEntrances;

  before(async () => {
    removeSensitiveEntrances = sails.helpers.removeSensitiveEntrances.with;
    userReq.token = await AuthTokenService.getUserToken();
    adminReq.token = await AuthTokenService.getAdminToken();
  });

  it('should not remove anything for an administrator', async () => {
    const res = await removeSensitiveEntrances({
      req: adminReq,
      data: sensitiveEntrancesTestData,
    });

    should(res).deepEqual(sensitiveEntrancesTestData);
  });

  it('should remove coordinates of sensitive entrances for an user and a visitor', async () => {
    const resUser = await removeSensitiveEntrances({
      req: userReq,
      data: sensitiveEntrancesTestData,
    });
    const resVisitor = await removeSensitiveEntrances({
      req: visitorReq,
      data: sensitiveEntrancesTestData,
    });

    const expectedResult = {
      ...sensitiveEntrancesTestData,
      entrances: [{ id: 1, isSensitive: true }, { id: 2 }],
      caves: [
        {
          id: 1,
          entrances: [{ id: 2 }, { id: 1, isSensitive: true }],
        },
      ],
      caver: {
        id: 42,
        exploredEntrances: [{ id: 2 }, { id: 3, isSensitive: true }],
        entrance: { id: 1 },
      },
      entrance: {
        id: 4,
        isSensitive: true,
      },
    };

    should(resUser).deepEqual(expectedResult);
    should(resVisitor).deepEqual(expectedResult);
  });
});
