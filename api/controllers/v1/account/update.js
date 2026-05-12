const AuthService = require('../../../services/AuthService');
const CaverService = require('../../../services/CaverService');

// Fields that can be updated via this endpoint. `currentPassword` is handled
// as an out-of-band credential (required when changing password) and is not
// persisted — it is listed here only so it passes the unknown-property guard.
const UPDATABLE_PROPERTIES = [
  'currentPassword',
  'email',
  'language',
  'name',
  'nickname',
  'password',
  'sendNotificationByEmail',
  'surname',
];

module.exports = async (req, res) => {
  const updates = {};

  // Reject unknown properties
  for (const prop of Object.keys(req.body)) {
    if (!UPDATABLE_PROPERTIES.includes(prop)) {
      return res.badRequest(
        `Could not update property ${prop}, it is not updatable via this endpoint.`
      );
    }
  }

  // Validate and collect each field
  if (req.body.email !== undefined) {
    if (!req.body.email) {
      return res.badRequest('You must provide an email.');
    }
    const normalizedEmail = req.body.email.toLowerCase();
    // Basic email format validation (must contain @ and a dot in the domain)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.badRequest('You must provide a valid email address.');
    }
    const existingEmail = await TCaver.findOne({ mail: normalizedEmail });
    if (existingEmail && existingEmail.id !== req.token.id) {
      return res.conflict('This email is already used.');
    }
    updates.mail = normalizedEmail;
  }

  if (req.body.password !== undefined) {
    if (!req.body.password) {
      return res.badRequest('You must provide a password.');
    }
    if (!req.body.currentPassword) {
      return res.badRequest(
        'You must provide your current password to set a new one.'
      );
    }
    const caver = await TCaver.findOne({ id: req.token.id });
    const isMatch = await AuthService.verifyPassword(
      caver.password,
      req.body.currentPassword
    );
    if (!isMatch) {
      return res.forbidden('Current password is incorrect.');
    }
    const validation = AuthService.validatePassword(req.body.password);
    if (!validation.valid) {
      return res.badRequest(validation.message);
    }
    updates.password = await AuthService.createHashedPassword(
      req.body.password
    );
  }

  if (req.body.language !== undefined) {
    if (!req.body.language) {
      return res.badRequest('You must provide a language.');
    }
    const foundLanguage = await TLanguage.findOne({ id: req.body.language });
    if (!foundLanguage) {
      return res.badRequest('The provided language does not exist.');
    }
    updates.language = foundLanguage.id;
  }

  if (req.body.name !== undefined) {
    updates.name = req.body.name === '' ? null : req.body.name;
  }

  if (req.body.surname !== undefined) {
    updates.surname = req.body.surname === '' ? null : req.body.surname;
  }

  if (req.body.sendNotificationByEmail !== undefined) {
    if (typeof req.body.sendNotificationByEmail !== 'boolean') {
      return res.badRequest('sendNotificationByEmail must be a boolean.');
    }
    updates.sendNotificationByEmail = req.body.sendNotificationByEmail;
  }

  if (req.body.nickname !== undefined) {
    if (!req.body.nickname) {
      return res.badRequest('You must provide a nickname.');
    }
    const existingCaver = await TCaver.findOne({
      nickname: req.body.nickname,
    });
    if (existingCaver && existingCaver.id !== req.token.id) {
      return res.conflict('This nickname is already used.');
    }
    updates.nickname = req.body.nickname;
  }

  if (Object.keys(updates).length === 0) {
    return res.badRequest('You must provide at least one field to update.');
  }

  try {
    const updatedCaver = await TCaver.updateOne({ id: req.token.id }).set(
      updates
    );

    if (!updatedCaver) {
      return res.notFound({
        message: `Caver with id ${req.token.id} not found.`,
      });
    }

    await CaverService.updateInSearch(updatedCaver);
  } catch (err) {
    if (err.name === 'UsageError' || err.code === 'E_INVALID_NEW_RECORD') {
      return res.badRequest('Invalid data provided.');
    }
    // Handle unique constraint violations (e.g., duplicate email or nickname)
    if (err.code === 'E_UNIQUE') {
      return res.conflict(
        'A caver with this email or nickname already exists.'
      );
    }
    sails.log.error(err);
    return res.serverError();
  }

  return res.ok();
};
