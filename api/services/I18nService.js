'use strict';

module.exports = {
  getPageData: function(req) {
    let locale = req.getLocale();
    let localesText = sails.config.i18n.localesText;
    return {
      locale: locale,
      localesList: JSON.stringify(localesText),
      catalog: JSON.stringify(this.getCatalog(req)),
    };
  },

  getCatalog: function(req) {
    let locale = req.getLocale();
    return req.i18n.locales[locale] ? req.i18n.locales[locale] : {};
  },
};