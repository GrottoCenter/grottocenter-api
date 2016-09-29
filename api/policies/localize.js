
module.exports = function(req, res, next) {
	if (req.param('lang') != undefined) {
		req.session.languagePreference = req.param('lang');
	}
	if (req.session.languagePreference == undefined) {
		req.session.languagePreference = "EN";
	}
	if (req.session.languagePreference != "") {
		req.setLocale(req.session.languagePreference);
	}
	next();
};