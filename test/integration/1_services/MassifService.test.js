const should = require('should');
const MassifService = require('../../../api/services/MassifService');

describe('MassifService', () => {
  describe('getCaves', () => {
    it('should get the caves inside the geogPolygon of a massif', async () => {
      const caves = await MassifService.getCaves({ id: 1 });
      should(caves.length).equal(2);
      should(caves).containDeep([{ id: 3 }, { id: 5 }]);
    });
  });
});
