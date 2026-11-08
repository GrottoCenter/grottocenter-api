const supertest = require('supertest');
const should = require('should');
const deletedListTests = require('../_helpers/deletedListTests');

// https://github.com/GrottoCenter/grottocenter-api/issues/1931
describe('Guideline find-all', () => {
  const created = [];

  const createGuideline = async (attributes) => {
    const guideline = await TGuideline.create({
      author: 1,
      language: 'fra',
      title: 'List guideline',
      description: 'A guideline of the list tests.',
      dateInscription: '2026-05-01T10:00:00.000Z',
      dateReviewed: '2026-05-01T10:00:00.000Z',
      ...attributes,
    }).fetch();
    created.push(guideline.id);
    return guideline;
  };

  deletedListTests({
    path: '/api/v1/guidelines',
    key: 'guidelines',
    model: () => TGuideline,
    // Guidelines are never merged.
    hasRedirect: false,
    seed: async () => {
      const active = await createGuideline({ title: 'Active list guideline' });
      const deleted = await createGuideline({
        title: 'Deleted list guideline',
        isDeleted: true,
      });
      return { activeIds: [active.id, 1], deletedIds: [deleted.id] };
    },
    cleanup: async () => {
      await TGuideline.destroy({ id: created });
    },
  });

  it('should sort the guidelines by id', async () => {
    const res = await supertest(sails.hooks.http.app)
      .get('/api/v1/guidelines')
      .expect(206);
    const ids = res.body.guidelines.map((g) => g.id);
    should(ids).eql([...ids].sort((a, b) => a - b));
  });
});
