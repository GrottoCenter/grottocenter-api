const should = require('should');
const AuthTokenService = require('../AuthTokenService');
const {
  sensitiveEntrancesTestData,
  simpleEntranceData,
} = require('./FAKE_DATA');

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
    const multipleEntrancesRes = await removeSensitiveEntrances({
      req: adminReq,
      data: sensitiveEntrancesTestData,
    });
    const simpleEntranceRes = await removeSensitiveEntrances({
      req: adminReq,
      data: simpleEntranceData,
    });

    should(multipleEntrancesRes).deepEqual(sensitiveEntrancesTestData);
    should(simpleEntranceRes).deepEqual(simpleEntranceData);
  });

  it('should remove coordinates of sensitive entrances for an user and a visitor', async () => {
    const multipleEntrancesResUser = await removeSensitiveEntrances({
      req: userReq,
      data: sensitiveEntrancesTestData,
    });
    const multipleEntrancesResVisitor = await removeSensitiveEntrances({
      req: visitorReq,
      data: sensitiveEntrancesTestData,
    });
    const simpleEntranceResUser = await removeSensitiveEntrances({
      req: userReq,
      data: simpleEntranceData,
    });
    const simpleEntranceResVisitor = await removeSensitiveEntrances({
      req: visitorReq,
      data: simpleEntranceData,
    });

    const expectedMultipleEntrancesResult = {
      ...sensitiveEntrancesTestData,
      entrances: [
        {
          id: 1,
          isSensitive: true,
          latitude: null,
          locations: [],
          longitude: null,
        },
        { id: 2 },
      ],
      caves: [
        {
          id: 1,
          entrances: [
            { id: 2 },
            {
              id: 1,
              isSensitive: true,
              latitude: null,
              locations: [],
              longitude: null,
            },
          ],
        },
      ],
      caver: {
        id: 42,
        exploredEntrances: [
          { id: 2 },
          {
            id: 3,
            isSensitive: true,
            latitude: null,
            locations: [],
            longitude: null,
          },
        ],
        entrance: { id: 1 },
      },
      entrance: {
        id: 4,
        isSensitive: true,
        latitude: null,
        locations: [],
        longitude: null,
      },
    };

    const expectedSimpleEntranceResult = {
      ...simpleEntranceData,
      latitude: null,
      locations: [],
      longitude: null,
    };

    should(multipleEntrancesResUser).deepEqual(expectedMultipleEntrancesResult);
    should(multipleEntrancesResVisitor).deepEqual(
      expectedMultipleEntrancesResult
    );
    should(simpleEntranceResUser).deepEqual(expectedSimpleEntranceResult);
    should(simpleEntranceResVisitor).deepEqual(expectedSimpleEntranceResult);
  });
});
