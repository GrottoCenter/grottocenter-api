/**
 * PartnerController.js
 *
 * @description :: Management of GC partners
 * @docs        :: http://sailsjs.org/#!documentation/controllers
 */

module.exports = {
  create: (req, res) =>
    res.badRequest('PartnerController.create not yet implemented!'),

  update: (req, res) =>
    res.badRequest('PartnerController.update not yet implemented!'),

  delete: (req, res) =>
    res.badRequest('PartnerController.delete not yet implemented!'),

  find: (req) => {
    TGrotto.findOne(req.params.id).exec((err, found) => {
      const params = {};
      params.controllerMethod = 'PartnerController.find';
      params.notFoundMessage = `Partner of id ${req.params.id} not found.`;
      return ControllerService.treat(req, err, found, params);
    });
  },

  findAll: (req, res) => {
    const parameters = {};
    if (req.param('name')) {
      parameters.name = {
        like: `%${req.param('name')}%`,
      };
      sails.log.debug(`parameters ${parameters.name.like}`);
    }

    TGrotto.find(parameters)
      .sort('id ASC')
      .exec((err, found) => {
        const params = {};
        params.controllerMethod = 'PartnerController.findAll';
        params.notFoundMessage = 'No partners found.';
        return ControllerService.treat(req, err, found, params, res);
      });
  },

  count: (req, res) => {
    TGrotto.count({ isOfficialPartner: true }).exec((err, found) => {
      const params = {
        controllerMethod: 'PartnerController.count',
        notFoundMessage: 'Problem while getting number of official partners.',
      };
      const count = {
        count: found,
      };
      return ControllerService.treat(req, err, count, params, res);
    });
  },

  findForCarousel: (req, res) => {
    let skip = 0;
    if (req.param('skip')) {
      skip = req.param('skip');
    }
    let limit = 30;
    if (req.param('limit')) {
      limit = req.param('limit');
    }
    TGrotto.find({ select: ['id', 'pictureFileName', 'customMessage'] })
      .skip(skip)
      .limit(limit)
      .sort('id ASC')
      .where({
        customMessage: {
          '!=': null,
        },
        pictureFileName: {
          '!=': '',
        },
        isOfficialPartner: '1',
      })
      .sort('id ASC')
      .populate('names')
      .exec((err, found) => {
        const params = {};
        params.controllerMethod = 'PartnerController.findForCarousel';
        params.notFoundMessage = 'No partners found.';
        return ControllerService.treat(req, err, found, params, res);
      });
  },
};
