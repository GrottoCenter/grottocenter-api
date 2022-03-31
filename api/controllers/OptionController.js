/**
 * OptionController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  findAll: async (req, res) => {
    try {
      const options = await TOption.find();
      return res.ok(options);
    } catch (err) {
      return res.serverError(
        'There was a problem while retrieving the options.'
      );
    }
  },
};
