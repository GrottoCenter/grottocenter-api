const { ListSuppressedDestinationsCommand } = require('@aws-sdk/client-sesv2');
const { awsSesCli } = require('../../config/awsSes');
const CommonService = require('./CommonService');

module.exports = {
  /**
   * Fetch all suppressed email addresses from SES, handling pagination.
   * @returns {string[]} Array of suppressed email addresses (lowercase).
   */
  async fetchSuppressedEmails() {
    const MAX_PAGES = 100;
    const emails = [];
    let nextToken;
    let pageCount = 0;

    do {
      const command = new ListSuppressedDestinationsCommand({
        Reasons: ['BOUNCE', 'COMPLAINT'],
        ...(nextToken ? { NextToken: nextToken } : {}),
      });

      // eslint-disable-next-line no-await-in-loop
      const response = await awsSesCli.send(command);

      if (response.SuppressedDestinationSummaries) {
        response.SuppressedDestinationSummaries.forEach((dest) => {
          emails.push(dest.EmailAddress.toLowerCase());
        });
      }

      nextToken = response.NextToken;
      pageCount += 1;

      if (pageCount >= MAX_PAGES) {
        sails.log.warn(
          `[SesSuppressionService] Hit max page limit (${MAX_PAGES}), stopping pagination`
        );
        break;
      }
    } while (nextToken);

    return emails;
  },

  /**
   * Mark cavers whose email appears in the suppressed list as invalid.
   * Case-insensitive comparison. Skips already-invalid cavers.
   * @param {string[]} suppressedEmails - Lowercase email addresses.
   * @returns {number} Number of caver records updated.
   */
  async markCaversAsInvalid(suppressedEmails) {
    if (suppressedEmails.length === 0) {
      return 0;
    }

    const result = await CommonService.query(
      `UPDATE t_caver SET mail_is_valid = false
       WHERE LOWER(mail) = ANY($1::text[]) AND mail_is_valid = true`,
      [suppressedEmails]
    );

    return result.rowCount;
  },
};
