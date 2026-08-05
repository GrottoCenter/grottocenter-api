const should = require('should');
const StatisticsMassifService = require('../../../api/services/StatisticsMassifService');

describe('StatisticsMassifService', () => {
  describe('getNbCavesInMassif()', () => {
    it('should count caves in massif 1 (2 caves)', async () => {
      const result = await StatisticsMassifService.getNbCavesInMassif(1);
      should.exist(result);
      result.should.have.property('nb_caves', '2');
    });

    it('should count caves in massif 2 (3 caves)', async () => {
      const result = await StatisticsMassifService.getNbCavesInMassif(2);
      should.exist(result);
      result.should.have.property('nb_caves', '3');
    });
  });

  describe('getNbNetworksInMassif()', () => {
    it('should count networks in massif 1 (1 network)', async () => {
      const result = await StatisticsMassifService.getNbNetworksInMassif(1);
      should.exist(result);
      result.should.have.property('nb_networks', '1');
    });

    it('should count networks in massif 2 (1 network)', async () => {
      const result = await StatisticsMassifService.getNbNetworksInMassif(2);
      should.exist(result);
      result.should.have.property('nb_networks', '1');
    });
  });

  describe('getCaveWithMaxDepthInMassif()', () => {
    it('should return deepest cave in massif 1 (Gouffre Berger, 1200m)', async () => {
      const result =
        await StatisticsMassifService.getCaveWithMaxDepthInMassif(1);
      should.exist(result);
      result.should.have.property('id_cave', 1);
      result.should.have.property('name_cave', 'Gouffre Berger');
      result.should.have.property('value', 1200);
    });

    it('should return deepest cave in massif 2 (Réseau Jean Bernard, 1602m)', async () => {
      const result =
        await StatisticsMassifService.getCaveWithMaxDepthInMassif(2);
      should.exist(result);
      result.should.have.property('id_cave', 3);
      result.should.have.property('name_cave', 'Réseau Jean Bernard');
      result.should.have.property('value', 1602);
    });
  });

  describe('getCaveWithMaxLengthInMassif()', () => {
    it('should return longest cave in massif 1 (Gouffre Berger, 10000m)', async () => {
      const result =
        await StatisticsMassifService.getCaveWithMaxLengthInMassif(1);
      should.exist(result);
      result.should.have.property('id_cave', 1);
      result.should.have.property('name_cave', 'Gouffre Berger');
      result.should.have.property('value', 10000);
    });

    it('should return longest cave in massif 2 (Réseau Jean Bernard, 23500m)', async () => {
      const result =
        await StatisticsMassifService.getCaveWithMaxLengthInMassif(2);
      should.exist(result);
      result.should.have.property('id_cave', 3);
      result.should.have.property('name_cave', 'Réseau Jean Bernard');
      result.should.have.property('value', 23500);
    });
  });

  describe('getNbCavesWhichAreDivingInMassif()', () => {
    it('should count diving caves in massif 1 (0 diving caves)', async () => {
      const result =
        await StatisticsMassifService.getNbCavesWhichAreDivingInMassif(1);
      should.exist(result);
      result.should.have.property('nb_diving_cave', '0');
    });

    it('should count diving caves in massif 2 (2 diving caves)', async () => {
      const result =
        await StatisticsMassifService.getNbCavesWhichAreDivingInMassif(2);
      should.exist(result);
      result.should.have.property('nb_diving_cave', '2');
    });
  });

  describe('getAvgDepthAndLengthInMassif()', () => {
    it('should calculate average depth (850m) and length (7500m) in massif 1', async () => {
      const result =
        await StatisticsMassifService.getAvgDepthAndLengthInMassif(1);
      should.exist(result);
      result.should.have.property('avg_depth');
      result.should.have.property('avg_length');
      result.avg_depth.should.be.approximately(850, 0.1);
      result.avg_length.should.be.approximately(7500, 0.1);
    });

    it('should calculate average depth (651.33m) and length (8725m) in massif 2', async () => {
      const result =
        await StatisticsMassifService.getAvgDepthAndLengthInMassif(2);
      should.exist(result);
      result.should.have.property('avg_depth');
      result.should.have.property('avg_length');
      result.avg_depth.should.be.approximately(651.33, 0.1);
      result.avg_length.should.be.approximately(8725, 0.1);
    });
  });

  describe('getTotalLength()', () => {
    it('should sum total length (15000m) with 2 data points in massif 1', async () => {
      const result = await StatisticsMassifService.getTotalLength(1);
      should.exist(result);
      result.should.have.property('value', 15000);
      result.should.have.property('nb_data', '2');
    });

    it('should sum total length (26175m) with 3 data points in massif 2', async () => {
      const result = await StatisticsMassifService.getTotalLength(2);
      should.exist(result);
      result.should.have.property('value', 26175);
      result.should.have.property('nb_data', '3');
    });
  });
});
