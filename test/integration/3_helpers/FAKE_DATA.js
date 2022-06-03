module.exports = {
  sensitiveEntrancesTestData: {
    name: 'test',
    entrances: [
      { id: 1, isSensitive: true, longitude: 4, latitude: 55 },
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
            locations: [{ id: 1 }, { id: 2 }],
            longitude: 2,
            latitude: 5,
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
          locations: [],
          longitude: 42,
          latitude: 30,
        },
      ],
      entrance: { id: 1 },
    },
    entrance: {
      id: 4,
      latitude: 55,
      longitude: 64,
      isSensitive: true,
    },
  },
};
