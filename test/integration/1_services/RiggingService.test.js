const should = require('should');
const RiggingService = require('../../../api/services/RiggingService');

describe('RiggingService', () => {
  describe('Complete and correct rigging', () => {
    it('should return a complete array of rigging objects for API', async () => {
      const rigging1 = {
        title: 'Rigging 1',
        obstacles: 'R3|;|R8|;|P12',
        ropes: '50 m|;|10 m|;|20 m',
        anchors: 'AN|;|3S + 1DEV|;|2S + 1S',
        observations:
          'Etrier en place|;|Quitter avant le fond sur la gauche.|;|Equiper le méandre en MC au plafond.',
      };
      const rigging2 = {
        title: 'Rigging 2',
        obstacles: 'R3|;|R7',
        ropes: '50 m|;|10 m',
        anchors: 'AN|;|4S + 1DEV',
        observations: 'Etrier en place|;|Quitter avant le fond sur la gauche.',
      };
      const riggings = [rigging1, rigging2];
      for (const rig of riggings)
        rig.obstacles = RiggingService.deserializeForAPI(rig);
      // Riggings length
      should(riggings.length).equal(2);
      should(riggings[0].obstacles.length).equal(3);
      should(riggings[1].obstacles.length).equal(2);

      // Riggings content
      should(riggings[0].obstacles[0]).deepEqual({
        obstacle: 'R3',
        rope: '50 m',
        anchor: 'AN',
        observation: 'Etrier en place',
      });

      should(riggings[1].obstacles[1]).deepEqual({
        obstacle: 'R7',
        rope: '10 m',
        anchor: '4S + 1DEV',
        observation: 'Quitter avant le fond sur la gauche.',
      });
    });
    it('should return a complete array of rigging strings for DB', async () => {
      const obstacles = [
        {
          obstacle: 'R3',
          rope: '50 m',
          anchor: 'AN',
          observation: 'Etrier en place',
        },
        {
          obstacle: 'R7',
          rope: '10 m',
          anchor: '4S + 1DEV',
          observation: 'Quitter avant le fond sur la gauche.',
        },
        {
          obstacle: 'P70',
          rope: '',
          observation: 'manquant',
        },
      ];
      const parsed = await RiggingService.serializeObstaclesForDB(obstacles);
      // Riggings content
      should(parsed.obstacles).equal('R3|;|R7|;|P70');
      should(parsed.ropes).equal('50 m|;|10 m|;|');
      should(parsed.anchors).equal('AN|;|4S + 1DEV|;|');
    });
  });

  describe('Riggings with missing values', () => {
    it('should return a complete array of rigging objects with empty string for missing values', async () => {
      const rigging1 = {
        title: 'Rigging 1',
        obstacles: 'R3|;||;|P12',
        ropes: '50 m|;|10 m|;|20 m',
        anchors: '|;|3S + 1DEV|;|2S + 1S',
        observations:
          'Etrier en place|;|Quitter avant le fond sur la gauche.|;|Equiper le méandre en MC au plafond.',
      };
      const rigging2 = {
        title: 'Rigging 2',
        obstacles: 'R3|;|R7',
        ropes: '50 m|;|',
        anchors: '|;||;|',
        observations: 'Etrier en place|;|Quitter avant le fond sur la gauche.',
      };
      const riggings = [rigging1, rigging2];
      for (const rig of riggings)
        rig.obstacles = RiggingService.deserializeForAPI(rig);
      // Riggings length
      should(riggings.length).equal(2);
      should(riggings[0].obstacles.length).equal(3);
      should(riggings[1].obstacles.length).equal(2);

      // Riggings content
      should(riggings[0].obstacles[0]).deepEqual({
        obstacle: 'R3',
        rope: '50 m',
        anchor: '',
        observation: 'Etrier en place',
      });

      should(riggings[1].obstacles[1]).deepEqual({
        obstacle: 'R7',
        rope: '',
        anchor: '',
        observation: 'Quitter avant le fond sur la gauche.',
      });
    });
  });

  describe('getEntranceRiggings()', () => {
    it('should return empty array when entranceId is null', async () => {
      const riggings = await RiggingService.getEntranceRiggings(null);
      should(riggings).be.an.Array();
      should(riggings.length).equal(0);
    });

    it('should get riggings for entrance', async () => {
      const riggings = await RiggingService.getEntranceRiggings(1);
      should(riggings).be.an.Array();
    });
  });

  describe('getEntranceHRiggings()', () => {
    it('should return empty array when entranceId is null', async () => {
      const riggings = await RiggingService.getEntranceHRiggings(null);
      should(riggings).be.an.Array();
      should(riggings.length).equal(0);
    });

    it('should get historical riggings for entrance', async () => {
      const riggings = await RiggingService.getEntranceHRiggings(1);
      should(riggings).be.an.Array();
    });
  });

  describe('getRigging()', () => {
    it('should get a rigging by id', async () => {
      const rigging = await RiggingService.getRigging(1);
      if (rigging) {
        should.exist(rigging.author);
      }
    });
  });

  describe('getHRiggings()', () => {
    it('should get historical riggings by id', async () => {
      const riggings = await RiggingService.getHRiggings(1);
      should(riggings).be.an.Array();
    });
  });

  describe('deserializeForAPI() - edge cases', () => {
    it('should handle rigging with null values', () => {
      const rigging = {
        obstacles: null,
        ropes: null,
        anchors: null,
        observations: null,
      };
      const result = RiggingService.deserializeForAPI(rigging);
      should(result).be.an.Array();
      should(result.length).equal(0);
    });

    it('should handle rigging with undefined values', () => {
      const rigging = {};
      const result = RiggingService.deserializeForAPI(rigging);
      should(result).be.an.Array();
      should(result.length).equal(0);
    });

    it('should filter out completely empty lines', () => {
      const rigging = {
        obstacles: '|;||;|R3',
        ropes: '|;||;|50m',
        anchors: '|;||;|AN',
        observations: '|;||;|Test',
      };
      const result = RiggingService.deserializeForAPI(rigging);
      should(result.length).equal(1);
      should(result[0].obstacle).equal('R3');
    });
  });
});
