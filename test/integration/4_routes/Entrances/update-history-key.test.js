const supertest = require('supertest');
const should = require('should');

const AuthTokenService = require('../../AuthTokenService');
const CommonService = require('../../../../api/services/CommonService');
const {
  ATTACH_ENTRANCE_HISTO_TRIGGER,
  DETACH_ENTRANCE_HISTO_TRIGGER,
} = require('../../../customSQL');

// #1987: the history trigger keys each snapshot by the date_reviewed of the
// replaced row and stamps the new row with now(), the transaction start time.
// Two updates of one entrance in one transaction used to leave the row with a
// date_reviewed already used as a history key, so that every later update
// failed with a uniqueness error on h_entrance (id, date_reviewed).
describe('Entrance update history key (#1987)', () => {
  let moderatorToken;
  let entranceId;

  const snapshots = async () =>
    (
      await CommonService.query(
        'SELECT date_reviewed, altitude FROM h_entrance WHERE id = $1 ORDER BY date_reviewed',
        [entranceId]
      )
    ).rows;

  const updateRequest = (body) =>
    supertest(sails.hooks.http.app)
      .put(`/api/v1/entrances/${entranceId}`)
      .set('Authorization', moderatorToken)
      .set('Content-type', 'application/json')
      .set('Accept', 'application/json')
      .send({
        name: { language: 'fra', text: 'History key entrance' },
        cave: 1,
        isSensitive: false,
        ...body,
      });

  before(async () => {
    moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
    const entrance = await TEntrance.create({
      author: 1,
      latitude: 45.123,
      longitude: 6.456,
      altitude: 100,
      dateInscription: new Date('2020-01-01T00:00:00Z'),
      cave: 1,
      country: 'FR',
      geology: 'Q35758',
      isPublic: true,
      isSensitive: false,
      modalities: 'NO,NO,NO,NO',
      hasContributions: false,
      isOfInterest: false,
    }).fetch();
    entranceId = entrance.id;
    await TName.create({
      entrance: entranceId,
      name: 'History key entrance',
      isMain: true,
      author: 1,
      language: 'fra',
      dateInscription: new Date(),
    });
    await CommonService.query(ATTACH_ENTRANCE_HISTO_TRIGGER);
  });

  after(async () => {
    await CommonService.query(DETACH_ENTRANCE_HISTO_TRIGGER);
    await CommonService.query('DELETE FROM h_entrance WHERE id = $1', [
      entranceId,
    ]);
    await TName.destroy({ entrance: entranceId });
    await TEntrance.destroy({ id: entranceId });
  });

  it('should keep one snapshot of the replaced state per update', async () => {
    await updateRequest({ altitude: 110 }).expect(200);
    await updateRequest({ altitude: 120 }).expect(200);

    const rows = await snapshots();
    should(rows.map((r) => r.altitude)).eql([100, 110]);
    const stored = await TEntrance.findOne(entranceId);
    should(stored.altitude).equal(120);
  });

  it('should update an entrance updated twice in one transaction', async () => {
    await sails.getDatastore().transaction(async (db) => {
      const bump =
        'UPDATE t_entrance SET altitude = altitude + 1 WHERE id = $1';
      await sails
        .getDatastore()
        .sendNativeQuery(bump, [entranceId])
        .usingConnection(db);
      await sails
        .getDatastore()
        .sendNativeQuery(bump, [entranceId])
        .usingConnection(db);
    });

    // The state left by that transaction: its date_reviewed is already a
    // history key, holding the intermediate altitude (121).
    const stuck = await TEntrance.findOne(entranceId);
    should(stuck.altitude).equal(122);
    const stuckKey = (await snapshots()).find(
      (r) => r.date_reviewed.getTime() === stuck.dateReviewed.getTime()
    );
    should(stuckKey).not.be.undefined();
    should(stuckKey.altitude).equal(121);

    await updateRequest({ altitude: 130 }).expect(200);

    const stored = await TEntrance.findOne(entranceId);
    should(stored.altitude).equal(130);

    // The snapshot under that key now holds the committed state, the one the
    // entrance actually had from that date on.
    const rows = await snapshots();
    const repaired = rows.find(
      (r) => r.date_reviewed.getTime() === stuck.dateReviewed.getTime()
    );
    should(repaired.altitude).equal(122);
    should(
      rows.filter(
        (r) => r.date_reviewed.getTime() === stuck.dateReviewed.getTime()
      )
    ).have.length(1);
  });
});
