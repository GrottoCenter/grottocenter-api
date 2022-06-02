const ramda = require('ramda');
const RightService = require('../services/RightService');
const getAllPaths = require('../utils/getAllPaths');

const cleanEntrance = (entrance) => {
  if (entrance.isSensitive) {
    /* eslint-disable no-param-reassign */
    delete entrance.locations;
    delete entrance.longitude;
    delete entrance.latitude;
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
      const entrancePathsToDelete = [];
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

      // "entrance" values are object
      const entrancePaths = getAllPaths(resultData, 'entrance');
      // Iterate over entrances
      for (const path of entrancePaths) {
        const keys = path.split('.');
        const entrance = ramda.pathOr({}, keys, resultData);
        cleanEntrance(entrance);
      }

      // Perform deletions
      for (const path of entrancePathsToDelete) {
        sails.log.info('deleting ', path);
        const keys = path.slice(0, -1);
        const prop = path.slice(-1);
        const parent = keys.reduce((obj, key) => obj[key], resultData);
        if (Array.isArray(parent)) {
          parent.splice(prop, 1);
        } else {
          delete parent[prop];
        }
      }
    }

    return exits.success(resultData);
  },
};
