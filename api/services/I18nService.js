/**
 */

module.exports = {
  getPageData: (req) => {
    const locale = req.getLocale();
    const { localesText } = sails.config.i18n;
    return {
      locale,
      localesList: JSON.stringify(localesText),
      catalog: JSON.stringify(I18nService.getCatalog(req)),
    };
  },

  getCatalog: (req) => {
    const locale = req.getLocale();
    return req.i18n.locales[locale] ? req.i18n.locales[locale] : {};
  },
};
