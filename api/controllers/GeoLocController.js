/**
 * GeolocController
 *
 * @description :: Server-side logic for managing geolocalization of Grottocenter entities
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

const ErrorService = require('../services/ErrorService');
const GeoLocService = require('../services/GeoLocService');

const checkAndGetCoordinatesParams = (req) => {
  let errorMessage = '';
  const errors = [];
  const neededParams = [
    { key: 'sw_lat', name: 'South west latitude', value: null },
    { key: 'sw_lng', name: 'South west longitude', value: null },
    { key: 'ne_lat', name: 'North east latitude', value: null },
    { key: 'ne_lng', name: 'North east longitude', value: null },
  ];

  const result = neededParams.map((param) => ({
    ...param,
    value: req.param(param.key, null),
  }));

  // Check null values
  const missingParams = result.filter((p) => p.value === null);
  if (missingParams.length > 0) {
    errorMessage = 'You must provide the following parameter(s): ';
    for (const missingParam of missingParams) {
      errors.push(`${missingParam.name} value on key ${missingParam.key}`);
    }
  } else {
    // Check valid values
    for (const param of result) {
      if (
        param.key.endsWith('lat')
        && (param.value < -90 || param.value > 90)
      ) {
        errors.push(
          `${param.name
          } value must be between -90 & 90 (value found: ${
            param.value
          })`,
        );
      }
      if (
        param.key.endsWith('lng')
        && (param.value < -180 || param.value > 180)
      ) {
        errors.push(
          `${param.name
          } value must be between -180 & 80 (value found: ${
            param.value
          })`,
        );
      }
    }
  }

  if (errors.length > 0) errorMessage += `${errors.join(', ')}.`;

  return {
    errorMessage,
    southWestBound: {
      lat: result.find((p) => p.key === 'sw_lat').value,
      lng: result.find((p) => p.key === 'sw_lng').value,
    },
    northEastBound: {
      lat: result.find((p) => p.key === 'ne_lat').value,
      lng: result.find((p) => p.key === 'ne_lng').value,
    },
  };
};

module.exports = {
  countEntrances: async (req, res) => {
    const {
      southWestBound,
      northEastBound,
      errorMessage,
    } = checkAndGetCoordinatesParams(req);

    if (errorMessage !== '') return res.badRequest(errorMessage);

    try {
      const result = await GeoLocService.countEntrances(
        southWestBound,
        northEastBound,
      );
      return res.json({ count: result });
    } catch (e) {
      ErrorService.getDefaultErrorHandler(res)(e);
      return false;
    }
  },

  findEntrancesCoordinates: async (req, res) => {
    const {
      southWestBound,
      northEastBound,
      errorMessage,
    } = checkAndGetCoordinatesParams(req);

    if (errorMessage !== '') return res.badRequest(errorMessage);

    try {
      const result = await GeoLocService.getEntrancesCoordinates(
        southWestBound,
        northEastBound,
        100000,
      );
      return res.json(result);
    } catch (e) {
      ErrorService.getDefaultErrorHandler(res)(e);
      return false;
    }
  },

  findEntrances: async (req, res) => {
    const {
      southWestBound,
      northEastBound,
      errorMessage,
    } = checkAndGetCoordinatesParams(req);

    if (errorMessage !== '') return res.badRequest(errorMessage);

    try {
      const result = await GeoLocService.getEntrancesMap(
        southWestBound,
        northEastBound,
        100000,
      );
      return res.json(result);
    } catch (e) {
      ErrorService.getDefaultErrorHandler(res)(e);
      return false;
    }
  },

  findGrottos: async (req, res) => {
    const {
      southWestBound,
      northEastBound,
      errorMessage,
    } = checkAndGetCoordinatesParams(req);

    if (errorMessage !== '') return res.badRequest(errorMessage);

    try {
      const result = await GeoLocService.getGrottosMap(
        southWestBound,
        northEastBound,
      );
      return res.json(result);
    } catch (e) {
      ErrorService.getDefaultErrorHandler(res)(e);
      return false;
    }
  },

  findNetworksCoordinates: async (req, res) => {
    const {
      southWestBound,
      northEastBound,
      errorMessage,
    } = checkAndGetCoordinatesParams(req);

    if (errorMessage !== '') return res.badRequest(errorMessage);

    try {
      const result = await GeoLocService.getNetworksCoordinates(
        southWestBound,
        northEastBound,
        100000,
      );
      return res.json(result);
    } catch (e) {
      ErrorService.getDefaultErrorHandler(res)(e);
      return false;
    }
  },

  findNetworks: async (req, res) => {
    const {
      southWestBound,
      northEastBound,
      errorMessage,
    } = checkAndGetCoordinatesParams(req);

    if (errorMessage !== '') return res.badRequest(errorMessage);

    try {
      const result = await GeoLocService.getNetworksMap(
        southWestBound,
        northEastBound,
      );
      return res.json(result);
    } catch (e) {
      ErrorService.getDefaultErrorHandler(res)(e);
      return false;
    }
  },
};
