const should = require('should');
const sinon = require('sinon');
const MassifService = require('../../../api/services/MassifService');
const EntranceService = require('../../../api/services/EntranceService');
const AuthTokenService = require('../AuthTokenService');
const CommonService = require('../../../api/services/CommonService');

describe('Massif Sensitivity Propagation', () => {
  const userReq = {};

  before(async () => {
    userReq.token = await AuthTokenService.getUserToken();
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should propagate sensitivity to entrances when a massif is marked as sensitive', async () => {
    let massifId;
    let caveId;
    let entranceId;

    try {
      // Step 1: Create a massif
      try {
        const massif = await TMassif.create({
          author: 1,
          dateInscription: new Date(),
          isSensitive: false,
          geogPolygon: 'SRID=4326;POLYGON((0 0, 1 0, 1 1, 0 1, 0 0))',
        }).fetch();
        massifId = massif.id;
      } catch (err) {
        throw new Error(`Failed to create massif: ${err.message}`);
      }

      // Step 2: Create a cave and entrance
      try {
        const cave = await TCave.create({
          author: 1,
          dateInscription: new Date(),
        }).fetch();
        caveId = cave.id;

        const createdEntranceData = await EntranceService.createEntrance(
          userReq,
          {
            author: 1,
            latitude: 0.5,
            longitude: 0.5,
            cave: caveId,
            isSensitive: false,
          },
          {
            name: {
              author: 1,
              text: 'Propagation Test Entrance',
              language: 'eng', // Use valid string code for Language
            },
          }
        );
        entranceId = createdEntranceData.id;

        // Verify the entrance actually has a name created
        const names = await TName.find({ entrance: entranceId });
        should.exist(names, 'TName array should exist');
        names.length.should.be.greaterThan(
          0,
          'Entrance should have at least one name created'
        );

        // Manually set point_geom
        await CommonService.query(
          'UPDATE t_entrance SET point_geom = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326) WHERE id = $1',
          [entranceId]
        );
      } catch (err) {
        throw new Error(`Failed to create cave/entrance setup: ${err.message}`);
      }

      // Step 3: Trigger Service propagation logic
      let propagationResult;
      try {
        propagationResult = await MassifService.setSensitivity(
          massifId,
          true,
          userReq.token.id
        );
      } catch (err) {
        throw new Error(
          `MassifService.setSensitivity threw an error: ${err.stack}`
        );
      }

      // Step 4: Verify Propagation
      try {
        propagationResult.updatedIds.should.containEql(entranceId);
        propagationResult.touristicSkipped.should.equal(0);

        const updatedEntrance = await TEntrance.findOne(entranceId);
        updatedEntrance.isSensitive.should.be.true(
          'Entrance did not inherit sensitivity from Massif'
        );

        const updatedMassif = await TMassif.findOne(massifId);
        updatedMassif.isSensitive.should.be.true(
          'Massif sensitivity was not updated in database'
        );
        updatedMassif.reviewer.should.equal(
          userReq.token.id,
          'Massif reviewer was not correctly set'
        );
      } catch (err) {
        throw new Error(`Verification step failed: ${err.message}`);
      }
    } finally {
      // Cleanup
      if (entranceId) {
        await TName.destroy({ entrance: entranceId }).catch(() => {});
        await TEntrance.destroyOne(entranceId).catch(() => {});
      }
      if (caveId) await TCave.destroyOne(caveId).catch(() => {});
      if (massifId) await TMassif.destroyOne(massifId).catch(() => {});
    }
  });

  it('should not propagate sensitivity reversal (keep manually set sensitivity)', async () => {
    let massifId;
    let caveId;
    let entranceId;

    try {
      // Step 1: Create a sensitive massif
      try {
        const massif = await TMassif.create({
          author: 1,
          dateInscription: new Date(),
          isSensitive: true,
          geogPolygon: 'SRID=4326;POLYGON((10 10, 11 10, 11 11, 10 11, 10 10))',
        }).fetch();
        massifId = massif.id;
      } catch (err) {
        throw new Error(`Failed to create massif: ${err.message}`);
      }

      // Step 2: Create a sensitive entrance
      try {
        const cave = await TCave.create({
          author: 1,
          dateInscription: new Date(),
        }).fetch();
        caveId = cave.id;

        const createdEntranceData = await EntranceService.createEntrance(
          userReq,
          {
            author: 1,
            latitude: 10.5,
            longitude: 10.5,
            cave: caveId,
            isSensitive: true,
          },
          {
            name: {
              author: 1,
              text: 'Sensitive Propagation Reversal Test Entrance',
              language: 'eng', // Use valid string code
            },
          }
        );
        entranceId = createdEntranceData.id;

        // Manually set point_geom
        await CommonService.query(
          'UPDATE t_entrance SET point_geom = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326) WHERE id = $1',
          [entranceId]
        );
      } catch (err) {
        throw new Error(`Failed to create cave/entrance setup: ${err.message}`);
      }

      // Step 3: Trigger Reversal logic
      try {
        await MassifService.setSensitivity(massifId, false, userReq.token.id);
      } catch (err) {
        throw new Error(
          `MassifService.setSensitivity threw an error: ${err.stack}`
        );
      }

      // Step 4: Verify Entrance stays sensitive
      try {
        const updatedEntrance = await TEntrance.findOne(entranceId);
        updatedEntrance.isSensitive.should.be.true(
          'Entrance lost its sensitive status inappropriately'
        );

        const updatedMassif = await TMassif.findOne(massifId);
        updatedMassif.isSensitive.should.be.false(
          'Massif failed to lose its sensitive status'
        );
        updatedMassif.reviewer.should.equal(
          userReq.token.id,
          'Massif reviewer was not correctly set during reversal'
        );
      } catch (err) {
        throw new Error(`Verification step failed: ${err.message}`);
      }
    } finally {
      // Cleanup
      if (entranceId) {
        await TName.destroy({ entrance: entranceId }).catch(() => {});
        await TEntrance.destroyOne(entranceId).catch(() => {});
      }
      if (caveId) await TCave.destroyOne(caveId).catch(() => {});
      if (massifId) await TMassif.destroyOne(massifId).catch(() => {});
    }
  });

  it('should skip touristic entrances during sensitivity cascade', async () => {
    let massifId;
    let caveId;
    let entranceId;

    try {
      massifId = (
        await TMassif.create({
          author: 1,
          dateInscription: new Date(),
          isSensitive: false,
          geogPolygon: 'SRID=4326;POLYGON((0 0, 1 0, 1 1, 0 1, 0 0))',
        }).fetch()
      ).id;

      caveId = (
        await TCave.create({
          author: 1,
          dateInscription: new Date(),
        }).fetch()
      ).id;

      const createdEntranceData = await EntranceService.createEntrance(
        userReq,
        {
          author: 1,
          latitude: 0.5,
          longitude: 0.5,
          cave: caveId,
          isSensitive: false,
          isTouristic: true,
        },
        {
          name: {
            author: 1,
            text: 'Touristic Cascade Entrance',
            language: 'eng',
          },
        }
      );
      entranceId = createdEntranceData.id;

      await CommonService.query(
        'UPDATE t_entrance SET point_geom = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326) WHERE id = $1',
        [entranceId]
      );

      const result = await MassifService.setSensitivity(
        massifId,
        true,
        userReq.token.id
      );

      result.updatedIds.should.not.containEql(entranceId);
      result.touristicSkipped.should.equal(1);

      const updatedEntrance = await TEntrance.findOne(entranceId);
      updatedEntrance.isSensitive.should.be.false();
    } finally {
      if (entranceId) {
        await TName.destroy({ entrance: entranceId }).catch(() => {});
        await TEntrance.destroyOne(entranceId).catch(() => {});
      }
      if (caveId) await TCave.destroyOne(caveId).catch(() => {});
      if (massifId) await TMassif.destroyOne(massifId).catch(() => {});
    }
  });

  it('should skip touristic entrances but mark non-touristic ones', async () => {
    let massifId;
    let caveId;
    let entranceIdTouristic;
    let entranceIdNonTouristic;

    try {
      massifId = (
        await TMassif.create({
          author: 1,
          dateInscription: new Date(),
          isSensitive: false,
          geogPolygon: 'SRID=4326;POLYGON((0 0, 1 0, 1 1, 0 1, 0 0))',
        }).fetch()
      ).id;

      caveId = (
        await TCave.create({
          author: 1,
          dateInscription: new Date(),
        }).fetch()
      ).id;

      // Create touristic entrance
      const entTouristic = await EntranceService.createEntrance(
        userReq,
        {
          author: 1,
          latitude: 0.5,
          longitude: 0.5,
          cave: caveId,
          isSensitive: false,
          isTouristic: true,
        },
        {
          name: {
            author: 1,
            text: 'Touristic Entrance',
            language: 'eng',
          },
        }
      );
      entranceIdTouristic = entTouristic.id;

      // Create non-touristic entrance
      const entNonTouristic = await EntranceService.createEntrance(
        userReq,
        {
          author: 1,
          latitude: 0.6,
          longitude: 0.6,
          cave: caveId,
          isSensitive: false,
          isTouristic: false,
        },
        {
          name: {
            author: 1,
            text: 'Non Touristic Entrance',
            language: 'eng',
          },
        }
      );
      entranceIdNonTouristic = entNonTouristic.id;

      // Manually set point_geom for both
      await CommonService.query(
        'UPDATE t_entrance SET point_geom = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326) WHERE id IN ($1, $2)',
        [entranceIdTouristic, entranceIdNonTouristic]
      );

      const result = await MassifService.setSensitivity(
        massifId,
        true,
        userReq.token.id
      );

      result.updatedIds.should.containEql(entranceIdNonTouristic);
      result.updatedIds.should.not.containEql(entranceIdTouristic);
      result.touristicSkipped.should.equal(1);

      const updatedTouristic = await TEntrance.findOne(entranceIdTouristic);
      updatedTouristic.isSensitive.should.be.false();

      const updatedNonTouristic = await TEntrance.findOne(
        entranceIdNonTouristic
      );
      updatedNonTouristic.isSensitive.should.be.true();
    } finally {
      if (entranceIdTouristic) {
        await TName.destroy({ entrance: entranceIdTouristic }).catch(() => {});
        await TEntrance.destroyOne(entranceIdTouristic).catch(() => {});
      }
      if (entranceIdNonTouristic) {
        await TName.destroy({ entrance: entranceIdNonTouristic }).catch(
          () => {}
        );
        await TEntrance.destroyOne(entranceIdNonTouristic).catch(() => {});
      }
      if (caveId) await TCave.destroyOne(caveId).catch(() => {});
      if (massifId) await TMassif.destroyOne(massifId).catch(() => {});
    }
  });

  it('should not auto-mark a touristic entrance as sensitive at creation', async () => {
    let massifId;
    let caveId;
    let entranceId;

    try {
      massifId = (
        await TMassif.create({
          author: 1,
          dateInscription: new Date(),
          isSensitive: true,
          geogPolygon: 'SRID=4326;POLYGON((0 0, 1 0, 1 1, 0 1, 0 0))',
        }).fetch()
      ).id;

      caveId = (
        await TCave.create({
          author: 1,
          dateInscription: new Date(),
        }).fetch()
      ).id;

      const createdEntranceData = await EntranceService.createEntrance(
        userReq,
        {
          author: 1,
          latitude: 0.5,
          longitude: 0.5,
          cave: caveId,
          isSensitive: false,
          isTouristic: true,
        },
        {
          name: {
            author: 1,
            text: 'Touristic Auto Mark Test Entrance',
            language: 'eng',
          },
        }
      );
      entranceId = createdEntranceData.id;

      const updatedEntrance = await TEntrance.findOne(entranceId);
      updatedEntrance.isSensitive.should.be.false();
      updatedEntrance.isTouristic.should.be.true();
    } finally {
      if (entranceId) {
        await TName.destroy({ entrance: entranceId }).catch(() => {});
        await TEntrance.destroyOne(entranceId).catch(() => {});
      }
      if (caveId) await TCave.destroyOne(caveId).catch(() => {});
      if (massifId) await TMassif.destroyOne(massifId).catch(() => {});
    }
  });

  it('should still auto-mark a non-touristic entrance as sensitive at creation', async () => {
    let massifId;
    let caveId;
    let entranceId;

    try {
      massifId = (
        await TMassif.create({
          author: 1,
          dateInscription: new Date(),
          isSensitive: true,
          geogPolygon: 'SRID=4326;POLYGON((0 0, 1 0, 1 1, 0 1, 0 0))',
        }).fetch()
      ).id;

      caveId = (
        await TCave.create({
          author: 1,
          dateInscription: new Date(),
        }).fetch()
      ).id;

      const createdEntranceData = await EntranceService.createEntrance(
        userReq,
        {
          author: 1,
          latitude: 0.5,
          longitude: 0.5,
          cave: caveId,
          isSensitive: false,
          isTouristic: false,
        },
        {
          name: {
            author: 1,
            text: 'Non Touristic Auto Mark Test Entrance',
            language: 'eng',
          },
        }
      );
      entranceId = createdEntranceData.id;

      const updatedEntrance = await TEntrance.findOne(entranceId);
      updatedEntrance.isSensitive.should.be.true();
    } finally {
      if (entranceId) {
        await TName.destroy({ entrance: entranceId }).catch(() => {});
        await TEntrance.destroyOne(entranceId).catch(() => {});
      }
      if (caveId) await TCave.destroyOne(caveId).catch(() => {});
      if (massifId) await TMassif.destroyOne(massifId).catch(() => {});
    }
  });

  it('should respect an explicit isSensitive=true on a touristic entrance', async () => {
    let massifId;
    let caveId;
    let entranceId;

    try {
      massifId = (
        await TMassif.create({
          author: 1,
          dateInscription: new Date(),
          isSensitive: true,
          geogPolygon: 'SRID=4326;POLYGON((0 0, 1 0, 1 1, 0 1, 0 0))',
        }).fetch()
      ).id;

      caveId = (
        await TCave.create({
          author: 1,
          dateInscription: new Date(),
        }).fetch()
      ).id;

      const createdEntranceData = await EntranceService.createEntrance(
        userReq,
        {
          author: 1,
          latitude: 0.5,
          longitude: 0.5,
          cave: caveId,
          isSensitive: true,
          isTouristic: true,
        },
        {
          name: {
            author: 1,
            text: 'Explicit Sensitive Touristic Test Entrance',
            language: 'eng',
          },
        }
      );
      entranceId = createdEntranceData.id;

      const updatedEntrance = await TEntrance.findOne(entranceId);
      updatedEntrance.isSensitive.should.be.true();
      updatedEntrance.isTouristic.should.be.true();
    } finally {
      if (entranceId) {
        await TName.destroy({ entrance: entranceId }).catch(() => {});
        await TEntrance.destroyOne(entranceId).catch(() => {});
      }
      if (caveId) await TCave.destroyOne(caveId).catch(() => {});
      if (massifId) await TMassif.destroyOne(massifId).catch(() => {});
    }
  });
});
