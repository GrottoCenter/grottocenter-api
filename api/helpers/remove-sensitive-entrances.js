const ramda = require('ramda');
const RightService = require('../services/RightService');
const getAllPaths = require('../utils/getAllPaths');

const cleanEntrance = (entrance) => {
  if (entrance.isSensitive) {
    /* eslint-disable no-param-reassign */
    entrance.locations = [];
    entrance.longitude = null;
    entrance.latitude = null;
    /* eslint-enable no-param-reassign */
  }
};

module.exports = {
  friendlyName: 'Remove sensitive entrances',
  description: 'Remove sensitive entrances from a data object.',
  inputs: {
    data: {
      type: 'ref',
      description: 'The data to remove the entrances from.',
      required: true,
    },
    req: {
      type: 'ref',
      description: 'The current incoming request (req).',
      required: true,
    },
  },

  exits: {
    success: {
      data: "The data with sensitive entrances removed if the user can't see them.",
    },
  },

  async fn(inputs, exits) {
    const { data, req } = inputs;
    const resultData = { ...data };
    const checkRight = sails.helpers.checkRight.with;

    // Retrieve user rights
    const hasCompleteViewRight = req.token
      ? await checkRight({
          groups: req.token.groups,
          rightEntity: RightService.RightEntities.ENTRANCE,
          rightAction: RightService.RightActions.VIEW_COMPLETE,
        }).tolerate('rightNotFound', () =>
          sails.log.error(
            'A server error occured when checking your right to entirely view an entrance.'
          )
        )
      : false;

    if (!hasCompleteViewRight) {
      // "entrances" values are array: we need to iterate on them
      const entrancesPaths = getAllPaths(resultData, 'entrances');

      // Iterate over entrance lists
      for (const path of entrancesPaths) {
        const keys = path.split('.');
        const entranceList = ramda.pathOr([], keys, resultData);
        // Iterate over entrances in list
        for (let idx = 0; idx < entranceList.length; idx += 1) {
          const entrance = entranceList[idx];
          cleanEntrance(entrance);
        }
      }

      // getAllPaths can throw a "Maximum call stack size exceeded" error if the data is too big.
      try {
        // "entrance" values are object
        const entrancePaths = getAllPaths(resultData, 'entrance');
        // Iterate over entrances
        for (const path of entrancePaths) {
          const keys = path.split('.');
          const entrance = ramda.pathOr({}, keys, resultData);
          cleanEntrance(entrance);
        }

        // Entrance object at the root of the data
        if (resultData.isSensitive && resultData['@base'] === 'entrances/') {
          cleanEntrance(resultData);
        }
      } catch (err) {
        sails.log.error(err);
      }
    }

    return exits.success(resultData);
  },
};
