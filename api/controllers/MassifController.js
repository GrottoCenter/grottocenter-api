/**
 * MassifController
 *
 * @description :: Server-side logic for managing massif
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {
  find: (req, res, next, converter = MappingV1Service.convertToMassifModel) => {
    TMassif.findOne({
      id: req.params.id,
    })
      .populate('author')
      .populate('caves')
      .populate('names')
      .populate('descriptions')
      .exec((err, found) => {
        const params = {};
        params.searchedItem = `Massif of id ${req.params.id}`;
        NameService.setNames(found.caves, 'cave').then((cavesPopulated) => {
          found.caves = cavesPopulated;
          return ControllerService.treatAndConvert(
            req,
            err,
            found,
            params,
            res,
            converter,
          );
        });
      });
  },
};
