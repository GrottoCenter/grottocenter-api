/**
 */

const GeolocController = require('../GeoLocController');

module.exports = {
  countEntrances: (req, res) => GeolocController.countEntrances(req, res),

  findEntrancesCoordinates: (req, res) =>
    GeolocController.findEntrancesCoordinates(req, res),

  findEntrances: (req, res) => GeolocController.findEntrances(req, res),

  findGrottos: (req, res) => GeolocController.findGrottos(req, res),

  findNetworksCoordinates: (req, res) =>
    GeolocController.findNetworksCoordinates(req, res),

  findNetworks: (req, res) => GeolocController.findNetworks(req, res),
};
