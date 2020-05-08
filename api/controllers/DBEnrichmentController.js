/**
 * DBEnrichmentController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

const SCRIPT_NAME = 'DBEnrichment';
const fs = require('fs');

module.exports = {
  /**
   * Checks if the script is already running, and if not, runs it with the parameters specified (country, type and detail)
   */
  launchDBEnrichment: (req, res) => {
    DBEnrichmentService.isScriptRunning(SCRIPT_NAME).then((result) => {
      if (result) {
        let progress = 'starting...';
        if (fs.existsSync('tmpDBEnrichmentProgress')) {
          progress = fs.readFileSync('tmpDBEnrichmentProgress', 'utf8');
        }
        return res.json({
          msg: 'script already running ...',
          progress: progress,
        });
      } else {
        const country = req.param('country');
        const type = req.param('type');
        const detail = req.param('detail');
        if (type) {
          if (type !== 'all') {
            return res.badRequest(
              'launchDBEnrichment : the optional parameter "type" can only be "all"',
            );
          }
        }
        if (detail) {
          if (
            detail !== 'country' &&
            detail !== 'region' &&
            detail !== 'county' &&
            detail !== 'city'
          ) {
            return res.badRequest(
              'launchDBEnrichment : the optional parameter "detail" can only be "country", "region", "county" or "city"',
            );
          }
        }
        DBEnrichmentService.runScript(
          SCRIPT_NAME + '.js',
          [
            country ? country : 'all',
            type ? type : 'completion',
            detail ? detail : 'city',
          ],
          (err) => {
            if (err) throw err;
          },
        );
        return res.json({ msg: 'script starting ...' });
      }
    });
  },
};
