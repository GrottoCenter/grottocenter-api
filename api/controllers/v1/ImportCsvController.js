const importCsvController = require('../ImportCsvController');

module.exports = {
  checkAll: (req, res) => importCsvController.checkAll(req, res),
  importAll: (req, res) => importCsvController.importAll(req, res),
};
