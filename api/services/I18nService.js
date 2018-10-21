'use strict';

module.exports = {
  getPageDate: function(req) {
    let locale = req.getLocale();
    let localesList = sails.config.i18n.locales;
    let localesText = sails.config.i18n.localesText;
    let localesListLabels = [];

    localesList.forEach(function(key) {
      if (localesText[key]) {
        localesListLabels.push({
          value: key,
          primaryText: localesText[key],
        });
      }
    });

    return {
      locale: locale,
      localesList: JSON.stringify(localesListLabels),
      catalog: JSON.stringify(this.getCatalog(req)),
    };
  },

  getCatalog: function(req) {
    let locale = req.getLocale();
    return req.i18n.locales[locale] ? req.i18n.locales[locale] : {};
  },
};