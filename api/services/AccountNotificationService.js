/**
 * AccountNotificationService.js
 *
 * @description :: Fire-and-forget notification emails for account changes
 * (email address update, password update). Errors are caught and logged —
 * these methods never throw.
 */

const LanguageService = require('./LanguageService');

module.exports = {
  /**
   * Send a notification email to the old email address when a user's email is changed.
   * Fire-and-forget — errors are logged but never thrown.
   *
   * @param {Object} params
   * @param {string} params.oldEmail - The email address before the change
   * @param {string} params.nickname - The caver's nickname (for greeting)
   * @param {number|string|null} params.languageId - The caver's language FK (for locale)
   */
  notifyEmailChanged: async ({ oldEmail, nickname, languageId }) => {
    try {
      const locale =
        (await LanguageService.getLocale(languageId)) ||
        sails.config.i18n.defaultLocale;

      await sails.helpers.sendEmail.with({
        allowResponse: false,
        emailSubject: 'Email Address Changed',
        locale,
        recipientEmail: oldEmail,
        viewName: 'emailChanged',
        viewValues: { recipientName: nickname },
      });
    } catch (error) {
      sails.log.error(
        `AccountNotificationService.notifyEmailChanged failed for ${oldEmail}: ${error.message}`
      );
    }
  },

  /**
   * Send a notification email to the current email address when a user's password is changed.
   * Fire-and-forget — errors are logged but never thrown.
   *
   * @param {Object} params
   * @param {string} params.email - The current email address
   * @param {string} params.nickname - The caver's nickname (for greeting)
   * @param {number|string|null} params.languageId - The caver's language FK (for locale)
   */
  notifyPasswordChanged: async ({ email, nickname, languageId }) => {
    try {
      const locale =
        (await LanguageService.getLocale(languageId)) ||
        sails.config.i18n.defaultLocale;

      await sails.helpers.sendEmail.with({
        allowResponse: false,
        emailSubject: 'Password Changed',
        locale,
        recipientEmail: email,
        viewName: 'passwordChanged',
        viewValues: { recipientName: nickname },
      });
    } catch (error) {
      sails.log.error(
        `AccountNotificationService.notifyPasswordChanged failed for ${email}: ${error.message}`
      );
    }
  },
};
