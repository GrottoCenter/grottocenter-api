/**
 * IndexController
 *
 * @description :: Server-side logic for managing Indices
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  index: (req, res) => res.view('grottocenter', I18nService.getPageData(req)),
};
