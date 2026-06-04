/* eslint-disable no-await-in-loop */
const should = require('should');
const GuidelineService = require('../../../api/services/GuidelineService');

describe('GuidelineService', () => {
  describe('resolveEntitiesExist()', () => {
    it('should resolve existing country', async () => {
      const exists = await GuidelineService.resolveEntitiesExist(
        ['FR'],
        [],
        []
      );
      should(exists).be.true();
    });

    it('should return false for non-existing country', async () => {
      const exists = await GuidelineService.resolveEntitiesExist(
        ['XX'],
        [],
        []
      );
      should(exists).be.false();
    });

    it('should resolve existing region', async () => {
      const exists = await GuidelineService.resolveEntitiesExist(
        [],
        ['FR-01'],
        []
      );
      should(exists).be.true();
    });

    it('should return false for non-existing region', async () => {
      const exists = await GuidelineService.resolveEntitiesExist(
        [],
        ['FR-99'],
        []
      );
      should(exists).be.false();
    });

    it('should resolve existing massif', async () => {
      const exists = await GuidelineService.resolveEntitiesExist([], [], [1]);
      should(exists).be.true();
    });

    it('should return false for non-existing massif', async () => {
      const exists = await GuidelineService.resolveEntitiesExist(
        [],
        [],
        [99999]
      );
      should(exists).be.false();
    });
  });

  describe('getGuideline()', () => {
    it('should return a guideline by ID', async () => {
      const guideline = await GuidelineService.getGuideline(1);
      should.exist(guideline);
      should(guideline.id).equal(1);
      should(guideline.title).equal('French National Caving Guideline');
      should.exist(guideline.author);
      should(guideline.author.login).equal('user1');
    });

    it('should return null for non-existing guideline ID', async () => {
      const guideline = await GuidelineService.getGuideline(999);
      should.not.exist(guideline);
    });
  });

  describe('getGuidelineHistory()', () => {
    it('should return historical snapshots for a guideline', async () => {
      const history = await GuidelineService.getGuidelineHistory(1);
      should(history).be.an.Array();
      should(history.length).equal(1);
      should(history[0].title).equal('French National Caving Guideline Draft');
    });

    it('should return empty array for guideline with no history', async () => {
      const history = await GuidelineService.getGuidelineHistory(2);
      should(history).be.an.Array();
      should(history.length).equal(0);
    });
  });

  describe('getGuidelinesForEntity()', () => {
    it('should get guidelines for country', async () => {
      const guidelines = await GuidelineService.getGuidelinesForEntity(
        'country',
        'FR'
      );
      should(guidelines).be.an.Array();
      should(guidelines.length).equal(1);
      should(guidelines[0].id).equal(1);
    });

    it('should get guidelines for region', async () => {
      const guidelines = await GuidelineService.getGuidelinesForEntity(
        'region',
        'FR-01'
      );
      should(guidelines).be.an.Array();
      should(guidelines.length).equal(1);
      should(guidelines[0].id).equal(3);
    });

    it('should get guidelines for massif', async () => {
      const guidelines = await GuidelineService.getGuidelinesForEntity(
        'massif',
        '1'
      );
      should(guidelines).be.an.Array();
      should(guidelines.length).equal(1);
      should(guidelines[0].id).equal(4);
    });
  });

  describe('getGuidelinesForCave()', () => {
    it('should return an empty massif group if cave has no massifs', async () => {
      const guidelines = await GuidelineService.getGuidelinesForCave(2);
      should(guidelines).be.an.Object();
      should(guidelines.massif).be.an.Array();
      should(guidelines.massif.length).equal(0);
    });

    it('should return guidelines for massifs of a cave', async () => {
      const guidelines = await GuidelineService.getGuidelinesForCave(1);
      should(guidelines).be.an.Object();
      should(guidelines.massif).be.an.Array();
      should(guidelines.massif.length).equal(1);
      should(guidelines.massif[0].id).equal(4);
    });
  });

  describe('getGuidelinesForEntrance()', () => {
    let originalEntrance;

    before(async () => {
      originalEntrance = await TEntrance.findOne({ id: 1 });
    });

    // Restore the entrance so the mutation below does not leak into other
    // tests sharing the same database (e.g. the sequential coverage run).
    after(async () => {
      await TEntrance.updateOne({ id: 1 }).set({
        country: originalEntrance.country,
        iso_3166_2: originalEntrance.iso_3166_2,
      });
    });

    it('should return guidelines rollup for entrance', async () => {
      await TEntrance.updateOne({ id: 1 }).set({
        country: 'FR',
        iso_3166_2: 'FR-01',
      });

      const rollup = await GuidelineService.getGuidelinesForEntrance(1);
      should(rollup).be.an.Object();
      should(rollup.country).be.an.Array();
      should(rollup.region).be.an.Array();
      should(rollup.massif).be.an.Array();

      const countryGuideline = rollup.country.find((g) => g.id === 1);
      should.exist(countryGuideline);
    });
  });
});
