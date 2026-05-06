const AuthService = require('../../../services/AuthService');
const CaverService = require('../../../services/CaverService');
const LanguageService = require('../../../services/LanguageService');

const PASSWORD_MIN_LENGTH = 8;

module.exports = async (req, res) => {
  // Check params
  let email = req.param('email');
  if (!email || !CaverService.isARealCaver(email)) {
    return res.badRequest('You must provide an email.');
  }
  email = email.toLowerCase();
  const caverEmail = await TCaver.findOne({ mail: email });
  if (caverEmail) {
    sails.log.warn(`Sign-up attempt with existing email: ${email}`);
    return res.conflict('Email or nickname is already used.');
  }

  const password = req.param('password');
  if (!password) {
    return res.badRequest('You must provide a password.');
  }
  if (password && password.length < PASSWORD_MIN_LENGTH) {
    return res.badRequest(
      `Your password must be at least ${PASSWORD_MIN_LENGTH} characters long.`
    );
  }

  const nickname = req.param('nickname');
  if (!nickname) {
    return res.badRequest('You must provide a nickname.');
  }
  const caverNickname = await TCaver.findOne({ nickname });
  if (caverNickname) {
    sails.log.warn(`Sign-up attempt with existing nickname: ${nickname}`);
    return res.conflict('Email or nickname is already used.');
  }

  // Validate optional language parameter (ISO 639-3 code)
  const languageParam = req.param('language');
  let language = '000'; // default null language id
  let locale;
  if (languageParam) {
    const foundLanguage = await TLanguage.findOne({ id: languageParam });
    if (!foundLanguage) {
      return res.badRequest('The provided language does not exist.');
    }
    language = foundLanguage.id;
    locale = await LanguageService.getLocale(language);
  }

  // Only generate the activation code after every other check passes
  const activationCode = AuthService.generateActivationCode();

  try {
    // Rely on the ORM for the rest of the input validation
    const newCaver = await TCaver.create({
      dateInscription: new Date(),
      language,
      mail: email,
      name: req.param('name') === '' ? null : req.param('name'),
      nickname,
      password: await AuthService.createHashedPassword(password),
      activated: false,
      mailIsValid: false,
      activationCode,
      surname: req.param('surname') === '' ? null : req.param('surname'),
    }).fetch();

    await CaverService.updateInSearch(newCaver);

    try {
      await AuthService.sendVerificationEmail(newCaver, activationCode, locale);
    } catch (_) {
      // Errors are already logged in AuthService.
      // We catch them here to ensure the signup itself isn't considered a failure if sending the email fails.
    }
  } catch (_) {
    return res.badRequest();
  }

  return res.ok();
};
