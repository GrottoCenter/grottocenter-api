const should = require('should');

describe('PointService', () => {
  let PointService;
  let planDocumentId;
  let deletedPlanDocumentId;
  const ARTICLE_DOCUMENT_ID = 5; // fixture, type 1 (not a plan)

  before(async () => {
    // eslint-disable-next-line global-require
    PointService = require('../../../api/services/PointService');
    const [plan, deletedPlan] = await Promise.all([
      TDocument.create({ author: 1, type: 13, license: 1 }).fetch(),
      TDocument.create({
        author: 1,
        type: 19,
        license: 1,
        isDeleted: true,
      }).fetch(),
    ]);
    planDocumentId = plan.id;
    deletedPlanDocumentId = deletedPlan.id;
  });

  after(async () => {
    await TDocument.destroy({ id: [planDocumentId, deletedPlanDocumentId] });
  });

  describe('validatePointInput', () => {
    it('accepts a point without a position', async () => {
      const result = await PointService.validatePointInput({
        label: '  Siphon 1  ',
      });
      should(result).deepEqual({ data: { label: 'Siphon 1' } });
    });

    it('accepts a point positioned on a plan document', async () => {
      const result = await PointService.validatePointInput({
        label: 'P1',
        caveId: 1,
        referenceDocumentId: planDocumentId,
        x: 12.5,
        y: -3,
      });
      should(result).deepEqual({
        data: {
          label: 'P1',
          cave: 1,
          referenceDocument: planDocumentId,
          x: 12.5,
          y: -3,
        },
      });
    });

    it('accepts clearing the position with three nulls', async () => {
      const result = await PointService.validatePointInput(
        { referenceDocumentId: null, x: null, y: null },
        { isUpdate: true }
      );
      should(result).deepEqual({
        data: { referenceDocument: null, x: null, y: null },
      });
    });

    const invalidCases = [
      ['a missing label on creation', {}],
      ['a blank label', { label: '   ' }],
      ['a non-string label', { label: 12 }],
      ['a label over 200 characters', { label: 'a'.repeat(201) }],
      ['a non-integer caveId', { label: 'P', caveId: 'abc' }],
      ['an unknown cave', { label: 'P', caveId: 999999 }],
      ['x without y', { label: 'P', x: 1, referenceDocumentId: 1 }],
      [
        'a partly null position',
        { label: 'P', referenceDocumentId: null, x: 1, y: 2 },
      ],
      ['a non-numeric x', { label: 'P', referenceDocumentId: 1, x: '1', y: 2 }],
      [
        'an infinite y',
        { label: 'P', referenceDocumentId: 1, x: 1, y: Infinity },
      ],
      [
        'a non-integer referenceDocumentId',
        { label: 'P', referenceDocumentId: 1.5, x: 1, y: 2 },
      ],
      [
        'an unknown reference document',
        { label: 'P', referenceDocumentId: 999999, x: 1, y: 2 },
      ],
      [
        'a reference document that is not a plan',
        { label: 'P', referenceDocumentId: ARTICLE_DOCUMENT_ID, x: 1, y: 2 },
      ],
    ];
    invalidCases.forEach(([name, params]) => {
      it(`rejects ${name}`, async () => {
        const result = await PointService.validatePointInput(params);
        should(result).have.property('error').which.is.a.String();
        should(result).not.have.property('data');
      });
    });

    it('rejects a deleted reference document', async () => {
      const result = await PointService.validatePointInput({
        label: 'P',
        referenceDocumentId: deletedPlanDocumentId,
        x: 1,
        y: 2,
      });
      should(result).have.property('error');
    });

    it('rejects an empty update', async () => {
      const result = await PointService.validatePointInput(
        {},
        { isUpdate: true }
      );
      should(result).have.property('error');
    });

    it('keeps the label optional on update', async () => {
      const result = await PointService.validatePointInput(
        { caveId: null },
        { isUpdate: true }
      );
      should(result).deepEqual({ data: { cave: null } });
    });
  });
});
