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

  describe('validatePointInput on creation', () => {
    it('accepts an underground point without coordinates', async () => {
      const result = await PointService.validatePointInput({
        label: '  Siphon 1  ',
        underground: true,
      });
      should(result).deepEqual({
        data: { label: 'Siphon 1', underground: true },
      });
    });

    it('accepts a surface point at latitude and longitude 0', async () => {
      const result = await PointService.validatePointInput({
        label: 'Null Island',
        caveId: 1,
        underground: false,
        latitude: 0,
        longitude: 0,
      });
      should(result).deepEqual({
        data: {
          label: 'Null Island',
          cave: 1,
          underground: false,
          latitude: '0',
          longitude: '0',
        },
      });
    });

    it('accepts the coordinate bounds', async () => {
      const result = await PointService.validatePointInput({
        label: 'P',
        underground: false,
        latitude: -90,
        longitude: 180,
      });
      should(result.data).match({ latitude: '-90', longitude: '180' });
    });

    const invalidCases = [
      ['a missing label', { underground: true }],
      ['a blank label', { label: '   ', underground: true }],
      ['a non-string label', { label: 12, underground: true }],
      [
        'a label over 200 characters',
        { label: 'a'.repeat(201), underground: true },
      ],
      ['a non-integer caveId', { label: 'P', underground: true, caveId: 'a' }],
      ['an unknown cave', { label: 'P', underground: true, caveId: 999999 }],
      ['a missing underground', { label: 'P' }],
      ['a null underground', { label: 'P', underground: null }],
      ['a string underground', { label: 'P', underground: 'false' }],
      ['a numeric underground', { label: 'P', underground: 0 }],
      [
        'a surface point without coordinates',
        { label: 'P', underground: false },
      ],
      [
        'a latitude without longitude',
        { label: 'P', underground: true, latitude: 45 },
      ],
      [
        'a null longitude with a latitude',
        { label: 'P', underground: true, latitude: 45, longitude: null },
      ],
      [
        'a string latitude',
        { label: 'P', underground: true, latitude: '45', longitude: 6 },
      ],
      [
        'an infinite longitude',
        { label: 'P', underground: true, latitude: 45, longitude: Infinity },
      ],
      [
        'a NaN latitude',
        { label: 'P', underground: true, latitude: NaN, longitude: 6 },
      ],
      [
        'a latitude over 90',
        { label: 'P', underground: false, latitude: 90.1, longitude: 6 },
      ],
      [
        'a longitude under -180',
        { label: 'P', underground: false, latitude: 45, longitude: -180.1 },
      ],
      [
        'a legacy referenceDocumentId',
        { label: 'P', underground: true, referenceDocumentId: 1 },
      ],
      ['a legacy x', { label: 'P', underground: true, x: 1 }],
    ];
    invalidCases.forEach(([name, params]) => {
      it(`rejects ${name}`, async () => {
        const result = await PointService.validatePointInput(params);
        should(result).have.property('error').which.is.a.String();
        should(result).not.have.property('data');
      });
    });
  });

  describe('validatePointInput on a partial update', () => {
    const surfacePoint = {
      id: 1,
      label: 'Surface',
      underground: false,
      latitude: '45.10000000000000000000',
      longitude: '6.20000000000000000000',
    };
    const unclassifiedPoint = {
      id: 2,
      label: 'Imported',
      underground: null,
      latitude: null,
      longitude: null,
    };

    it('rejects an empty update', async () => {
      const result = await PointService.validatePointInput({}, surfacePoint);
      should(result).have.property('error');
    });

    it('changes only the fields sent', async () => {
      const result = await PointService.validatePointInput(
        { caveId: null },
        surfacePoint
      );
      should(result).deepEqual({ data: { cave: null } });
    });

    it('accepts one coordinate when the stored pair stays complete', async () => {
      const result = await PointService.validatePointInput(
        { latitude: 0 },
        surfacePoint
      );
      should(result).deepEqual({ data: { latitude: '0' } });
    });

    it('rejects clearing the coordinates of a surface point', async () => {
      const result = await PointService.validatePointInput(
        { latitude: null, longitude: null },
        surfacePoint
      );
      should(result).have.property('error');
    });

    it('accepts clearing the coordinates when the point goes underground', async () => {
      const result = await PointService.validatePointInput(
        { underground: true, latitude: null, longitude: null },
        surfacePoint
      );
      should(result).deepEqual({
        data: { underground: true, latitude: null, longitude: null },
      });
    });

    it('rejects clearing one coordinate only', async () => {
      const result = await PointService.validatePointInput(
        { underground: true, longitude: null },
        surfacePoint
      );
      should(result).have.property('error');
    });

    it('keeps an unclassified point editable', async () => {
      const result = await PointService.validatePointInput(
        { label: 'Renamed' },
        unclassifiedPoint
      );
      should(result).deepEqual({ data: { label: 'Renamed' } });
    });

    it('classifies a point as surface only with coordinates', async () => {
      const without = await PointService.validatePointInput(
        { underground: false },
        unclassifiedPoint
      );
      should(without).have.property('error');
      const withCoordinates = await PointService.validatePointInput(
        { underground: false, latitude: 45, longitude: 6 },
        unclassifiedPoint
      );
      should(withCoordinates).deepEqual({
        data: { underground: false, latitude: '45', longitude: '6' },
      });
    });

    it('rejects unclassifying a point', async () => {
      const result = await PointService.validatePointInput(
        { underground: null },
        surfacePoint
      );
      should(result).have.property('error');
    });
  });

  describe('validatePositionInput', () => {
    it('accepts a position at 0, 0 on a plan', async () => {
      const result = await PointService.validatePositionInput(planDocumentId, {
        x: 0,
        y: 0,
      });
      should(result).deepEqual({ data: { x: 0, y: 0 } });
    });

    it('rejects non-numeric coordinates', async () => {
      const result = await PointService.validatePositionInput(planDocumentId, {
        x: '1',
        y: 2,
      });
      should(result).match({ status: 'badRequest' });
    });

    it('rejects a missing coordinate', async () => {
      const result = await PointService.validatePositionInput(planDocumentId, {
        x: 1,
      });
      should(result).match({ status: 'badRequest' });
    });

    it('rejects a document that is not a plan', async () => {
      const result = await PointService.validatePositionInput(
        ARTICLE_DOCUMENT_ID,
        { x: 1, y: 2 }
      );
      should(result).match({ status: 'badRequest' });
    });

    it('answers not found for a deleted or unknown document', async () => {
      const deleted = await PointService.validatePositionInput(
        deletedPlanDocumentId,
        { x: 1, y: 2 }
      );
      should(deleted).match({ status: 'notFound' });
      const unknown = await PointService.validatePositionInput(999999, {
        x: 1,
        y: 2,
      });
      should(unknown).match({ status: 'notFound' });
    });
  });

  describe('updatePoint', () => {
    const createdPointIds = [];

    // An underground point with coordinates: either update alone is valid,
    // but together they leave a surface point without coordinates.
    const createUndergroundPointWithCoordinates = async () => {
      const point = await TPoint.create({
        label: 'Concurrent point',
        author: 1,
        underground: true,
        latitude: '45',
        longitude: '6',
      }).fetch();
      createdPointIds.push(point.id);
      return point;
    };

    // The location rules of a stored point
    const shouldBeAValidLocation = (point) => {
      should(point.latitude === null).equal(point.longitude === null);
      if (point.underground === false) should(point.latitude).not.be.null();
    };

    after(async () => {
      await TPoint.destroy({ id: createdPointIds });
    });

    it('validates against the values committed by an update that held the lock', async () => {
      const point = await createUndergroundPointWithCoordinates();

      let releaseLock;
      const lockReleased = new Promise((resolve) => {
        releaseLock = resolve;
      });
      let lockTaken;
      const lockHeld = new Promise((resolve) => {
        lockTaken = resolve;
      });
      // Another writer locks the point and clears its coordinates... A
      // Waterline deferred only runs once awaited: Promise.resolve() starts it.
      const otherWriter = Promise.resolve(
        sails.getDatastore().transaction(async (db) => {
          await sails
            .sendNativeQuery(
              'SELECT id FROM t_point WHERE id = $1 FOR UPDATE',
              [point.id]
            )
            .usingConnection(db);
          lockTaken();
          await lockReleased;
          await TPoint.updateOne({ id: point.id })
            .set({ latitude: null, longitude: null })
            .usingConnection(db);
        })
      );
      await lockHeld;

      // ...while this update, valid against the state it started from, waits.
      const update = PointService.updatePoint(
        point.id,
        { underground: false },
        1
      );
      await new Promise((resolve) => {
        setTimeout(resolve, 200);
      });
      releaseLock();
      await otherWriter;

      const result = await update;
      should(result).have.property('error');
      const stored = await TPoint.findOne({ id: point.id });
      should(stored.underground).equal(true);
      shouldBeAValidLocation(stored);
    });

    it('never stores an invalid location under concurrent updates', async () => {
      const points = await Promise.all(
        Array.from({ length: 5 }, createUndergroundPointWithCoordinates)
      );
      await Promise.all(
        points.map(async (point) => {
          const results = await Promise.all([
            PointService.updatePoint(point.id, { underground: false }, 1),
            PointService.updatePoint(
              point.id,
              { latitude: null, longitude: null },
              1
            ),
          ]);
          should(results.filter((r) => r.ok)).have.length(1);
          shouldBeAValidLocation(await TPoint.findOne({ id: point.id }));
        })
      );
    });

    it('answers not found for a deleted point', async () => {
      const point = await createUndergroundPointWithCoordinates();
      await TPoint.updateOne({ id: point.id }).set({ isDeleted: true });
      should(
        await PointService.updatePoint(point.id, { label: 'New' }, 1)
      ).deepEqual({ notFound: true });
    });
  });
});
