const supertest = require('supertest');
const should = require('should');
const sinon = require('sinon');
const AuthTokenService = require('../../AuthTokenService');

const POSITION = '46°06\'08"N 6°30\'36"E';

describe('Description writes report the quarantine verdict (#1762)', () => {
  let userToken;
  let moderatorToken;
  const createdIds = [];

  const query = (sql, params) => CommonService.query(sql, params);
  const api = () => supertest(sails.hooks.http.app);
  const create = async (body) => {
    const res = await api()
      .post('/api/v1/descriptions')
      .send({ title: 'T', body, language: 'eng', entrance: 1 })
      .set('Authorization', userToken)
      .expect(200);
    createdIds.push(res.body.id);
    return res.body;
  };
  const patch = (id, body) =>
    api()
      .patch(`/api/v1/descriptions/${id}`)
      .send({ body })
      .set('Authorization', userToken)
      .expect(200);
  const stored = async (id) => {
    const { rows } = await query(
      "SELECT * FROM t_bot_text_scan WHERE source_table = 't_description' AND source_id = $1",
      [id]
    );
    return rows[0];
  };

  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
    moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
  });

  afterEach(async () => {
    sinon.restore();
    await query('TRUNCATE t_bot_text_scan');
  });

  after(async () => {
    await TDescription.destroy({ id: createdIds });
  });

  it('creates clean text with botSurface.quarantined false', async () => {
    const body = await create('A clean text.');

    should(body.botSurface).eql({
      quarantined: false,
      patternId: null,
      matchExcerpt: null,
    });
    should((await stored(body.id)).matched).be.false();
  });

  it('flags matching text written over clean text', async () => {
    const { id } = await create('A clean text.');

    const res = await patch(id, POSITION);

    should(res.body.botSurface.quarantined).be.true();
    should(res.body.botSurface.patternId).equal('dms');
    should(res.body.botSurface.matchExcerpt).be.a.String();
    should((await stored(id)).matched).be.true();
  });

  it('clears the flag when clean text is written over matching text, and says so', async () => {
    const { id } = await create(POSITION);
    should((await stored(id)).matched).be.true();

    const res = await patch(id, 'Moved to the position fields.');

    should(res.body.botSurface).eql({
      quarantined: false,
      patternId: null,
      matchExcerpt: null,
    });
    should((await stored(id)).matched).be.false();
  });

  it('updates the pattern id when a different family matches', async () => {
    const { id } = await create(POSITION);

    const res = await patch(id, 'N 46.10222 E 6.51234');

    should(res.body.botSurface.patternId).equal('hemisphere-prefix');
    should((await stored(id)).pattern_id).equal('hemisphere-prefix');
  });

  it('still saves and reports quarantined when the detector throws', async () => {
    // eslint-disable-next-line global-require
    const detector = require('../../../../api/utils/coordinateDetector');
    const stub = sinon.stub(detector, 'detect').throws(new Error('boom'));

    const body = await create('Text saved anyway.');

    should(stub.callCount).be.aboveOrEqual(1);
    should(body.botSurface.quarantined).be.true();
    should(body.botSurface.patternId).equal('error');
    const saved = await TDescription.findOne({ id: body.id });
    should(saved.body).equal('Text saved anyway.');
  });

  it('re-checks a restored description', async () => {
    const { id } = await TDescription.create({
      isDeleted: true,
      author: 1,
      entrance: 1,
      language: 'eng',
      title: 'T',
      body: POSITION,
    }).fetch();
    createdIds.push(id);

    const res = await api()
      .post(`/api/v1/descriptions/${id}/restore`)
      .set('Authorization', moderatorToken)
      .expect(200);

    should(res.body.botSurface.quarantined).be.true();
  });
});
