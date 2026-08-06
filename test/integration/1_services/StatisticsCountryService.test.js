const should = require('should');
const StatisticsCountryService = require('../../../api/services/StatisticsCountryService');

describe('StatisticsCountryService', () => {
  describe('getNbMassifsInCountry()', () => {
    it('should count distinct massifs (3 massifs)', async () => {
      const result = await StatisticsCountryService.getNbMassifsInCountry('FR');
      should.exist(result);
      result.should.have.property('nb_massifs', '3');
    });
  });

  describe('getNbCavesInCountry()', () => {
    it('should count distinct caves (5 caves)', async () => {
      const result = await StatisticsCountryService.getNbCavesInCountry('FR');
      should.exist(result);
      result.should.have.property('nb_caves', '5');
    });
  });

  describe('getNbNetworksInCountry()', () => {
    it('should count caves with multiple entrances (2 networks)', async () => {
      const result =
        await StatisticsCountryService.getNbNetworksInCountry('FR');
      should.exist(result);
      result.should.have.property('nb_networks', '2');
    });
  });

  describe('getCaveWithMaxDepthInCountry()', () => {
    it('should return deepest cave (Réseau Jean Bernard, 1602m)', async () => {
      const result =
        await StatisticsCountryService.getCaveWithMaxDepthInCountry('FR');
      should.exist(result);
      result.should.have.property('id_cave', 4);
      result.should.have.property('name_cave', 'Réseau Jean Bernard');
      result.should.have.property('value', 1602);
    });
  });

  describe('getCaveWithMaxLengthInCountry()', () => {
    it('should return longest cave (Réseau Jean Bernard, 23500m)', async () => {
      const result =
        await StatisticsCountryService.getCaveWithMaxLengthInCountry('FR');
      should.exist(result);
      result.should.have.property('id_cave', 4);
      result.should.have.property('name_cave', 'Réseau Jean Bernard');
      result.should.have.property('value', 23500);
    });
  });

  describe('getNbCavesWhichAreDivingInCountry()', () => {
    it('should count diving caves (2 diving caves)', async () => {
      const result =
        await StatisticsCountryService.getNbCavesWhichAreDivingInCountry('FR');
      should.exist(result);
      result.should.have.property('nb_diving_cave', '2');
    });
  });

  describe('getAvgDepthAndLengthInCountry()', () => {
    it('should calculate average depth (730.8m) and length (8235m)', async () => {
      const result =
        await StatisticsCountryService.getAvgDepthAndLengthInCountry('FR');
      should.exist(result);
      result.should.have.property('avg_depth');
      result.should.have.property('avg_length');
      result.avg_depth.should.be.approximately(730.8, 0.1);
      result.avg_length.should.be.approximately(8235, 0.1);
    });
  });

  describe('getTotalLength()', () => {
    it('should sum total length (41175m) with 5 data points', async () => {
      const result = await StatisticsCountryService.getTotalLength('FR');
      should.exist(result);
      result.should.have.property('value', 41175);
      result.should.have.property('nb_data', '5');
    });
  });
});
