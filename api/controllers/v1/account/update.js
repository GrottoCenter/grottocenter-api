const AccountNotificationService = require('../../../services/AccountNotificationService');
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
  let verificationEmail = null;
  let caver = null;

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

    // Fetch the caver early so we can compare against the current email
    caver = await TCaver.findOne({ id: req.token.id });

    if (caver.mail === normalizedEmail) {
      // If user submits their current email while a change is pending, cancel it
      if (caver.pendingMail) {
        await TCaver.updateOne({ id: req.token.id }).set({
          pendingMail: null,
          activationCode: null,
          mailIsValid: true,
        });
        return res.ok({ message: 'Pending email change cancelled.' });
      }
      return res.badRequest(
        'The new email must be different from the current one.'
      );
    }

    // Check uniqueness against both mail and pendingMail (exclude self)
    const alreadyInUse = await TCaver.findOne({
      id: { '!=': req.token.id },
      or: [{ mail: normalizedEmail }, { pendingMail: normalizedEmail }],
    });
    if (alreadyInUse) {
      return res.conflict('This email is already in use.');
    }

    // Generate activation code and store as pending (don't update mail directly)
    const activationCode = AuthService.generateActivationCode();
    updates.pendingMail = normalizedEmail;
    updates.activationCode = activationCode;
    updates.mailIsValid = false;

    // Send verification email (fire-and-forget, after the update is persisted)
    // We store a reference to send it after the DB update below
    verificationEmail = {
      nickname: caver.nickname,
      mail: normalizedEmail,
      activationCode,
      locale: req.getLocale ? req.getLocale() : undefined,
    };
  }

  // Fetch current caver before any updates — needed for password verification
  // and for notification emails (pre-update email address). This runs on every
  // update (even non-sensitive fields) to keep the flow simple; the cost is a
  // single primary-key lookup which is negligible compared to the overall request.
  if (!caver) {
    caver = await TCaver.findOne({ id: req.token.id });
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
    const nicknameConflict =
      (
        await TCaver.find({
          nickname: req.body.nickname,
          id: { '!=': req.token.id },
        }).limit(1)
      ).length > 0;
    if (nicknameConflict) {
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

    // Send verification email for pending email change (fire-and-forget)
    if (verificationEmail) {
      AuthService.sendVerificationEmail(
        {
          nickname: verificationEmail.nickname,
          mail: verificationEmail.mail,
        },
        verificationEmail.activationCode,
        verificationEmail.locale
      ).catch((err) => {
        sails.log.error(
          'Failed to send verification email for email change:',
          err
        );
      });
    }

    // Fire-and-forget password change notification
    if (updates.password) {
      AccountNotificationService.notifyPasswordChanged({
        email: caver.mail,
        nickname: caver.nickname,
        languageId: caver.language,
      }).catch((err) => {
        sails.log.error('Failed to send password change notification:', err);
      });
    }
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
