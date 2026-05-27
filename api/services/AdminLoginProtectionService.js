/**
 * AdminLoginProtectionService.js
 *
 * @description :: Handles consecutive failure tracking, account banning,
 *                 and suspicious-activity email notifications for
 *                 Administrator accounts. All state is persisted in the
 *                 database (stateless service).
 */

const LanguageService = require('./LanguageService');

module.exports = {
  /**
   * Record a failed login attempt for an admin account.
   * Increments the loginFailedAttempts counter, updates lastFailedLoginAt,
   * bans the account if the threshold is reached, and sends notification
   * emails as appropriate (fire-and-forget).
   * @param {Object} caver - The caver record (with groups populated)
   * @param {string} ip - Source IP address
   * @returns {Promise<{ banned: boolean }>}
   */
  async recordFailedLogin(caver, ip) {
    const threshold = sails.config.custom.adminLoginFailureThreshold || 5;
    const suspiciousThreshold =
      sails.config.custom.suspiciousActivityEmailThreshold || 3;
    const cooldownMs =
      sails.config.custom.suspiciousActivityEmailCooldown || 900000;

    const newCount = (caver.loginFailedAttempts || 0) + 1;
    const banned = newCount >= threshold;
    const now = new Date();

    const updateValues = {
      loginFailedAttempts: newCount,
      lastFailedLoginAt: now,
    };

    if (banned) {
      updateValues.banned = true;
    }

    // Check if suspicious-activity email should be sent
    if (newCount >= suspiciousThreshold && !banned) {
      const lastEmailAt = caver.lastSuspiciousEmailAt
        ? new Date(caver.lastSuspiciousEmailAt)
        : null;
      const cooldownExpired =
        !lastEmailAt || now.getTime() - lastEmailAt.getTime() >= cooldownMs;

      if (cooldownExpired) {
        // Update the timestamp BEFORE sending so that concurrent requests
        // within the cooldown window don't trigger duplicate emails.
        // If SES fails (logged but swallowed), no alert is sent during this
        // window — an acceptable trade-off vs. potential email storms.
        updateValues.lastSuspiciousEmailAt = now;
        // Fire-and-forget: send suspicious login email
        this.sendSuspiciousLoginEmail(caver, {
          failedAttempts: newCount,
          lastAttemptTime: now.toISOString(),
          sourceIp: ip || 'unknown',
        });
      }
    }

    await TCaver.updateOne({ id: caver.id }).set(updateValues);

    if (banned) {
      sails.log.warn(
        `AdminLoginProtection: account ${caver.id} banned after ${newCount} failed login attempts (IP: ${ip || 'unknown'})`
      );
      // Fire-and-forget: send ban notification email
      this.sendAccountBannedEmail(caver, {
        lastAttemptTime: now.toISOString(),
        sourceIp: ip || 'unknown',
      });
    }

    return { banned };
  },

  /**
   * Record a failed TOTP attempt for an admin account.
   * Increments the totpFailedAttempts counter and bans the account
   * if the threshold is reached.
   * @param {Object} caver - The caver record
   * @returns {Promise<{ banned: boolean }>}
   */
  async recordFailedTotp(caver) {
    const threshold = sails.config.custom.adminTotpFailureThreshold || 5;
    const newCount = (caver.totpFailedAttempts || 0) + 1;
    const banned = newCount >= threshold;

    const updateValues = {
      totpFailedAttempts: newCount,
    };

    if (banned) {
      updateValues.banned = true;
    }

    await TCaver.updateOne({ id: caver.id }).set(updateValues);

    if (banned) {
      sails.log.warn(
        `AdminLoginProtection: account ${caver.id} banned after ${newCount} failed TOTP attempts`
      );
    }

    return { banned };
  },

  /**
   * Reset failure counters on successful login.
   * @param {number} caverId
   * @returns {Promise<void>}
   */
  async resetCounters(caverId) {
    await TCaver.updateOne({ id: caverId }).set({
      loginFailedAttempts: 0,
      totpFailedAttempts: 0,
    });
  },

  /**
   * Check if an admin account is banned.
   * @param {Object} caver - The caver record
   * @returns {boolean}
   */
  isAccountBanned(caver) {
    return caver.banned === true;
  },

  /**
   * Send a suspicious-login notification email (fire-and-forget).
   * Errors are caught and logged — this method never throws.
   * @param {Object} caver - The caver record
   * @param {Object} details
   * @param {number} details.failedAttempts
   * @param {string} details.lastAttemptTime - ISO 8601 UTC
   * @param {string} details.sourceIp
   */
  sendSuspiciousLoginEmail(
    caver,
    { failedAttempts, lastAttemptTime, sourceIp }
  ) {
    const doSend = async () => {
      const locale =
        (await LanguageService.getLocale(caver.language)) ||
        sails.config.i18n.defaultLocale;

      await sails.helpers.sendEmail.with({
        allowResponse: false,
        emailSubject: 'Suspicious Login Activity',
        locale,
        recipientEmail: caver.mail,
        viewName: 'suspiciousLogin',
        viewValues: {
          recipientName: caver.nickname,
          failedAttempts,
          lastAttemptTime,
          sourceIp,
        },
      });
    };

    // Fire-and-forget with error logging
    doSend().catch((error) => {
      sails.log.error(
        `AdminLoginProtection: failed to send suspicious-login email for caver ${caver.id} at ${new Date().toISOString()}: ${error.message}`
      );
    });
  },

  /**
   * Send an account-banned notification email (fire-and-forget).
   * Errors are caught and logged — this method never throws.
   * @param {Object} caver - The caver record
   * @param {Object} details
   * @param {string} details.lastAttemptTime - ISO 8601 UTC
   * @param {string} details.sourceIp
   */
  sendAccountBannedEmail(caver, { lastAttemptTime, sourceIp }) {
    const doSend = async () => {
      const locale =
        (await LanguageService.getLocale(caver.language)) ||
        sails.config.i18n.defaultLocale;

      await sails.helpers.sendEmail.with({
        allowResponse: false,
        emailSubject: 'Account Banned',
        locale,
        recipientEmail: caver.mail,
        viewName: 'accountBanned',
        viewValues: {
          recipientName: caver.nickname,
          lastAttemptTime,
          sourceIp,
        },
      });
    };

    // Fire-and-forget with error logging
    doSend().catch((error) => {
      sails.log.error(
        `AdminLoginProtection: failed to send account-banned email for caver ${caver.id} at ${new Date().toISOString()}: ${error.message}`
      );
    });
  },
};
