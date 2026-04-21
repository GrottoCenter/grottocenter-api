const SesSuppressionService = require('../services/SesSuppressionService');
const { awsSesCli } = require('../../config/awsSes');

function getMsUntilNextExec() {
  // Next day at 3 AM UTC (offset from dbSync's 2 AM to avoid overlap)
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 1);
  d.setUTCHours(3, 0, 0, 0);
  return d.getTime() - Date.now();
}

async function pollSuppressionList() {
  sails.log.info('[sesSuppressionPoller] Starting polling cycle');

  if (!(await awsSesCli.areAwsCredentialsSet())) {
    sails.log.info(
      '[sesSuppressionPoller] No AWS credentials configured, skipping'
    );
    return;
  }

  try {
    const suppressedEmails =
      await SesSuppressionService.fetchSuppressedEmails();

    if (suppressedEmails.length === 0) {
      sails.log.info('[sesSuppressionPoller] Suppression list is empty');
      return;
    }

    const updatedCount =
      await SesSuppressionService.markCaversAsInvalid(suppressedEmails);

    sails.log.info(
      `[sesSuppressionPoller] Polling cycle complete: ${suppressedEmails.length} suppressed destinations, ${updatedCount} cavers updated`
    );
  } catch (error) {
    sails.log.error('[sesSuppressionPoller] Polling cycle error:', error);
  }
}

let pollerTimer = null;
function registerPoller() {
  clearTimeout(pollerTimer);
  pollerTimer = setTimeout(() => {
    registerPoller();
    pollSuppressionList().catch((err) =>
      sails.log.error('[sesSuppressionPoller] pollSuppressionList error', err)
    );
  }, getMsUntilNextExec());
}

module.exports = {
  registerPoller,
  pollSuppressionList,
  getMsUntilNextExec,
};
