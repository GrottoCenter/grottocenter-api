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
   * Checks if the script is already running, and if not, runs it with the parameters specified (country and type)
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
        if (type) {
          if (type !== 'completion') {
            return res.badRequest(
              'launchDBEnrichment : the optional parameter "type" can only be "completion"',
            );
          }
        }
        DBEnrichmentService.runScript(
          SCRIPT_NAME + '.js',
          [country ? country : 'all', type ? type : 'all'],
          (err) => {
            if (err) throw err;
          },
        );
        return res.json({ msg: 'script starting ...' });
      }
    });
  },
};
