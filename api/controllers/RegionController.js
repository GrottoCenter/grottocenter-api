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

  search: (req, res, next, converter) => {
    const orSearchArray = [];
    if (req.param('name', null)) {
      const name = req.param('name');
      /* Case insensitive search + first letter capitalized
          Example with "grot" => search with ["grot", "grot", "GROT", "Grot"]
                  with "GROT" => search with ["GROT", "grot", "GROT", "Grot"]
                  with "Grot" => search with ["Grot", "grot", "GROT", "Grot"]
            ===>  in all cases, it searches with all the possible cases
        */
      orSearchArray.push({ name: { contains: name } });
      orSearchArray.push({
        name: { contains: name.toLowerCase() },
      });
      orSearchArray.push({
        name: { contains: name.toUpperCase() },
      });
      orSearchArray.push({
        name: {
          contains: name.charAt(0).toUpperCase() + name.slice(1).toLowerCase(),
        },
      });
    }
    if (req.param('code', null)) {
      const code = req.param('code');
      orSearchArray.push({ code: { contains: code } });
      orSearchArray.push({
        code: { contains: code.toLowerCase() },
      });
      orSearchArray.push({
        code: { contains: code.toUpperCase() },
      });
      orSearchArray.push({
        code: {
          contains: code.charAt(0).toUpperCase() + code.slice(1).toLowerCase(),
        },
      });
    }

    TRegion.find()
      .where({
        or: orSearchArray,
        isDeprecated: req.param('isDeprecated'),
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
