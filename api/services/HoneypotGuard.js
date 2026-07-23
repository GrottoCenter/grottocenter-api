/**
 * HoneypotGuard.js
 *
 * @description :: Stateless utility that inspects the request body for a
 *                 hidden decoy `website` field. Bots that auto-fill all form
 *                 fields will populate this invisible field, allowing cheap
 *                 detection without external API calls.
 */

const isNonBlankString = require('../utils/isNonBlankString');

module.exports = {
  /**
   * Check whether the honeypot field indicates bot activity.
   *
   * @param {Object} body - The parsed request body
   * @returns {{ trapped: boolean, value: string|undefined }}
   */
  check(body) {
    const value = body && body.website;
    if (isNonBlankString(value)) {
      return { trapped: true, value };
    }
    return { trapped: false };
  },
};
