/**
 * FileFormatController
 *
 * @description :: Server-side logic for managing file formats
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {
  findAll: async (req, res) => {
    try {
      const fileFormats = await TFileFormat.find();
      return res.ok(fileFormats);
    } catch (err) {
      return res.serverError(
        'There was a problem while retrieving the file formats.',
      );
    }
  },
};
