const moment = require('moment');

module.exports = {
  // See https://ontology.uis-speleo.org/howto/ for more informations
  KARSTLINK_DATE_FORMAT: 'YYYY-MM-DD',
  getDateFromKarstlink: (value) =>
    moment(value, module.exports.KARSTLINK_DATE_FORMAT),
};
