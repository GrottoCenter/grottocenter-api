const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Entrance update with duplicate names', () => {
  let userToken;
  let entrance;
  let cave;
  let mainName;
  let duplicateName;

  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();

    // Create test cave
    cave = await TCave.create({
      author: 1,
      dateInscription: new Date(),
    }).fetch();

    // Create test entrance
    entrance = await TEntrance.create({
      author: 1,
      latitude: '44.245',
      longitude: '4.404',
      geology: 'Q35758',
      cave: cave.id,
      dateInscription: new Date(),
    }).fetch();

    // Create main name
    mainName = await TName.create({
      author: 1,
      entrance: entrance.id,
      name: 'Main Name',
      isMain: true,
      language: '000',
      dateInscription: new Date(),
    }).fetch();

    // Create duplicate empty name
    duplicateName = await TName.create({
      author: 1,
      entrance: entrance.id,
      name: '',
      isMain: false,
      language: '000',
      dateInscription: new Date(),
    }).fetch();
  });

  after(async () => {
    await TName.destroy({ id: [mainName.id, duplicateName.id] });
    await TEntrance.destroy({ id: entrance.id });
    await TCave.destroy({ id: cave.id });
  });

  it('should update entrance name successfully despite duplicate names', (done) => {
    supertest(sails.hooks.http.app)
      .put(`/api/v1/entrances/${entrance.id}`)
      .set('Authorization', userToken)
      .set('Content-type', 'application/json')
      .send({
        name: { language: 'fra', text: 'Updated Name' },
        cave: cave.id,
        isSensitive: false,
        longitude: 4.404556779663873,
        latitude: 44.24536890277871,
        altitude: 292,
      })
      .expect(200)
      .end(async (err) => {
        if (err) return done(err);

        // Verify the main name was updated
        const updatedName = await TName.findOne({
          entrance: entrance.id,
          isMain: true,
        });

        should(updatedName.name).equal('Updated Name');
        return done();
      });
  });
});
