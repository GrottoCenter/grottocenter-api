const supertest = require('supertest');
const should = require('should');

// fileMiddleware parses multipart bodies on every request, before routing, so a
// malformed body on any path used to fall through to Sails' catch-all as a bare
// 500 (#1809). A scanner probing `/wp-admin/admin-ajax.php` triggered it.
const MULTIPART = 'multipart/form-data; boundary=x';

// Opening boundary with no part and no closing boundary.
const TRUNCATED = '--x\r\n';

// A part whose headers never end.
const UNFINISHED_PART =
  '--x\r\nContent-Disposition: form-data; name="file"; filename="a.txt"\r\n';

const WELL_FORMED =
  '--x\r\nContent-Disposition: form-data; name="title"\r\n\r\nhello\r\n--x--\r\n';

const expectBadRequest = (res) => {
  should(res.status).equal(400);
  should(res.body.message).startWith('Malformed multipart body: ');
};

describe('Malformed multipart body', () => {
  it('answers 400 on GET /', async () => {
    const res = await supertest(sails.hooks.http.app)
      .get('/')
      .set('Content-Type', MULTIPART)
      .send(TRUNCATED);
    expectBadRequest(res);
    should(res.body.message).equal(
      'Malformed multipart body: Unexpected end of form'
    );
  });

  it('answers 400 on an unknown path', async () => {
    const res = await supertest(sails.hooks.http.app)
      .get('/wp-admin/admin-ajax.php')
      .set('Content-Type', MULTIPART)
      .send(TRUNCATED);
    expectBadRequest(res);
  });

  it('answers 400 on an upload endpoint, before any policy', async () => {
    const res = await supertest(sails.hooks.http.app)
      .post('/api/v1/documents')
      .set('Content-Type', MULTIPART)
      .send(UNFINISHED_PART);
    expectBadRequest(res);
  });

  it('still routes a well-formed multipart body', async () => {
    const res = await supertest(sails.hooks.http.app)
      .get('/wp-admin/admin-ajax.php')
      .set('Content-Type', MULTIPART)
      .send(WELL_FORMED);
    should(res.status).equal(404);
  });
});
