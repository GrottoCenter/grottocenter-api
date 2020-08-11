/**
 * RegionController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  find: (req, res, next) => {
    TRegion.findOne({
      id: req.params.id,
    }).exec((err, found) => {
      const params = {};
      params.controllerMethod = 'TRegionController.find';
      params.searchedItem = `Region of id ${req.params.id}`;
      return ControllerService.treat(req, err, found, params, res);
    });
  },

  findAll: (req, res, next) => {
    TRegion.find().exec((err, found) => {
      const params = {
        controllerMethod: 'TRegionController.findAll',
        searchedItem: 'All regions',
      };
      const formattedFound = {
        regions: found,
      };
      return ControllerService.treat(req, err, formattedFound, params, res);
    });
  },

  findDeprecatedByName: (req, res, next, converter) => {
    TRegion.find()
      .where({
        /* Case insensitive search + first letter capitalized
          Example with "grot" => search with ["grot", "grot", "GROT", "Grot"]
                  with "GROT" => search with ["GROT", "grot", "GROT", "Grot"]
                  with "Grot" => search with ["Grot", "grot", "GROT", "Grot"]
            ===>  in all cases, it searches with all the possible cases
        */
        or: [
          { name: { contains: req.params.name } },
          { name: { contains: req.params.name.toLowerCase() } },
          { name: { contains: req.params.name.toUpperCase() } },
          {
            name: {
              contains:
                req.params.name.charAt(0).toUpperCase() +
                req.params.name.slice(1).toLowerCase(),
            },
          },
        ],
        isDeprecated: true,
      })
      .exec((err, found) => {
        const params = {};
        params.controllerMethod = 'TRegionController.findByName';
        params.searchedItem = `Region with name ${req.params.name}`;
        const formattedFound = {
          regions: found,
        };
        return ControllerService.treat(req, err, formattedFound, params, res);
      });
  },
};
