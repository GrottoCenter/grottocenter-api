module.exports = (req, res, next) => {
  if (req.param('lang') !== undefined) {
    req.session.languagePreference = req.param('lang');
  }
  if (
    req.getLocale() !== undefined
    && req.session.languagePreference === undefined
  ) {
    req.session.languagePreference = req.getLocale();
  }
  if (req.session.languagePreference === undefined) {
    req.session.languagePreference = 'en';
  }
  if (req.session.languagePreference !== '') {
    req.setLocale(req.session.languagePreference);
  }
  next();
};
