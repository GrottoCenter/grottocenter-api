/**
 */

const searchController = require('../SearchController');

module.exports = {
  search: (req, res) => {
    searchController.search(req, res);
  },

  advancedSearch: (req, res) => {
    searchController.advancedSearch(req, res);
  },
};
