const should = require('should');
const StatisticsRegionService = require('../../../api/services/StatisticsRegionService');

describe('StatisticsRegionService', () => {
  describe('getNbMassifsInRegion()', () => {
    it('should count distinct massifs (2 massifs in FR-ARA)', async () => {
      const result =
        await StatisticsRegionService.getNbMassifsInRegion('FR-ARA');
      should.exist(result);
      result.should.have.property('nb_massifs', '2');
    });
  });

  describe('getNbCavesInRegion()', () => {
    it('should count distinct caves (3 caves in FR-ARA)', async () => {
      const result = await StatisticsRegionService.getNbCavesInRegion('FR-ARA');
      should.exist(result);
      result.should.have.property('nb_caves', '3');
    });
  });

  describe('getNbNetworksInRegion()', () => {
    it('should count caves with multiple entrances (2 networks in FR-ARA)', async () => {
      const result =
        await StatisticsRegionService.getNbNetworksInRegion('FR-ARA');
      should.exist(result);
      result.should.have.property('nb_networks', '2');
    });
  });

  describe('getCaveWithMaxDepthInRegion()', () => {
    it('should return deepest cave (Réseau Jean Bernard, 1602m)', async () => {
      const result =
        await StatisticsRegionService.getCaveWithMaxDepthInRegion('FR-ARA');
      should.exist(result);
      result.should.have.property('id_cave', 2);
      result.should.have.property('name_cave', 'Réseau Jean Bernard');
      result.should.have.property('value', 1602);
    });
  });

  describe('getCaveWithMaxLengthInRegion()', () => {
    it('should return longest cave (Réseau Jean Bernard, 23500m)', async () => {
      const result =
        await StatisticsRegionService.getCaveWithMaxLengthInRegion('FR-ARA');
      should.exist(result);
      result.should.have.property('id_cave', 2);
      result.should.have.property('name_cave', 'Réseau Jean Bernard');
      result.should.have.property('value', 23500);
    });
  });

  describe('getNbCavesWhichAreDivingInRegion()', () => {
    it('should count diving caves (0 in FR-ARA)', async () => {
      const result =
        await StatisticsRegionService.getNbCavesWhichAreDivingInRegion(
          'FR-ARA'
        );
      should.exist(result);
      result.should.have.property('nb_diving_cave', '0');
    });

    it('should count diving caves (1 in FR-PAC)', async () => {
      const result =
        await StatisticsRegionService.getNbCavesWhichAreDivingInRegion(
          'FR-PAC'
        );
      should.exist(result);
      result.should.have.property('nb_diving_cave', '1');
    });
  });

  describe('getAvgDepthAndLengthInRegion()', () => {
    it('should calculate average depth (954m) and length (11316.67m) in FR-ARA', async () => {
      const result =
        await StatisticsRegionService.getAvgDepthAndLengthInRegion('FR-ARA');
      should.exist(result);
      result.should.have.property('avg_depth');
      result.should.have.property('avg_length');
      result.avg_depth.should.be.approximately(954, 0.1);
      result.avg_length.should.be.approximately(11316.67, 0.1);
    });
  });

  describe('getTotalLength()', () => {
    it('should sum total length (33950m) with 3 data points in FR-ARA', async () => {
      const result = await StatisticsRegionService.getTotalLength('FR-ARA');
      should.exist(result);
      result.should.have.property('value', 33950);
      result.should.have.property('nb_data', '3');
    });
  });
});
