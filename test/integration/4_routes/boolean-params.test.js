const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../AuthTokenService');

// Every boolean request parameter goes through parseBool: an unrecognised value
// is a 400 naming the parameter, never a silent true or false. The isPermanent
// cases of the delete routes live in deleteIsPermanentCases.js, the documents
// entries of multiple-validate in Documents/multiple-validate.test.js.

const QUERY_GARBAGE = ['yes', 'TRUE', '2'];
// A JSON body can also carry numbers, which are not accepted either.
const BODY_GARBAGE = ['yes', 'TRUE', 1];

const ENDPOINTS = [
  { method: 'get', url: '/api/v1/documents', param: 'isValidated' },
  { method: 'get', url: '/api/v1/documents/1', param: 'requireUpdate' },
  { method: 'get', url: '/api/v1/entrances/1/snapshots', param: 'isNetwork' },
  {
    method: 'get',
    url: '/api/v1/entrances/1/all-snapshots',
    param: 'isNetwork',
  },
  ...[
    'count',
    'identifiers',
    'identifiers-paginated',
    'records',
    'records-paginated',
  ].map((path) => ({
    method: 'get',
    url: `/api/v1/bibliographic-metadata/${path}`,
    param: 'includeDeleted',
  })),
  {
    method: 'post',
    url: '/api/v1/advanced-search',
    param: 'matchAllFields',
    body: { query: 'test', entity: 'caves' },
  },
  {
    method: 'post',
    url: '/api/v1/field-search',
    param: 'matchAllFields',
    body: { query: 'test', entity: 'caves', field: 'name' },
  },
  {
    method: 'post',
    url: '/api/v1/advanced-search/export',
    param: 'matchAllFields',
    body: {
      query: 'test',
      entity: 'organizations',
      columns: ['id'],
      columnsName: ['ID'],
    },
  },
  ...['alert_for_news', 'send_notification_by_email'].map((param) => ({
    method: 'patch',
    url: '/api/v1/account/notifications',
    param,
  })),
  { method: 'post', url: '/api/v1/caves', param: 'isDiving' },
  { method: 'put', url: '/api/v1/caves/1', param: 'isDiving' },
  ...['hasBat', 'isSensitive', 'isTouristic'].map((param) => ({
    method: 'post',
    url: '/api/v1/entrances',
    param,
  })),
  ...['dangerCo2', 'isSensitiveLocked'].map((param) => ({
    method: 'put',
    url: '/api/v1/entrances/1',
    param,
  })),
  { method: 'get', url: '/api/v1/languages', param: 'isPrefered' },
  { method: 'get', url: '/api/v1/documents/types', param: 'isAvailable' },
  {
    method: 'patch',
    url: '/api/v1/account',
    param: 'sendNotificationByEmail',
  },
  { method: 'post', url: '/api/v1/massifs', param: 'isSensitive' },
  { method: 'put', url: '/api/v1/massifs/1', param: 'isSensitiveLocked' },
];

describe('Boolean request parameters', () => {
  let token;

  before(async () => {
    token = await AuthTokenService.getRawBearerAllGroupsToken();
  });

  ENDPOINTS.forEach(({ method, url, param, body }) => {
    const garbage = method === 'get' ? QUERY_GARBAGE : BODY_GARBAGE;
    garbage.forEach((value) => {
      it(`${method.toUpperCase()} ${url} should return 400 for ${param}=${JSON.stringify(value)}`, async () => {
        const request = supertest(sails.hooks.http.app)
          [method](url)
          .set('Authorization', token)
          .set('Accept', 'application/json');
        const res = await (
          method === 'get'
            ? request.query({ [param]: value })
            : request.send({ ...body, [param]: value })
        ).expect(400);

        should(res.body.code).equal('E_BAD_REQUEST');
        should(res.body.metadata.field).equal(param);
        should(res.body.metadata.value).eql(value);
      });
    });
  });

  describe('rejected writes leave the data untouched', () => {
    it('should not update the entrance when one flag is invalid', async () => {
      const before = await TEntrance.findOne(1);

      await supertest(sails.hooks.http.app)
        .put('/api/v1/entrances/1')
        .set('Authorization', token)
        .send({ hasBat: !before.hasBat, dangerCo2: 'yes' })
        .expect(400);

      const after = await TEntrance.findOne(1);
      should(after.hasBat).equal(before.hasBat);
    });

    it('should not update the cave when isDiving is invalid', async () => {
      const before = await TCave.findOne(1);

      await supertest(sails.hooks.http.app)
        .put('/api/v1/caves/1')
        .set('Authorization', token)
        .send({ depth: (before.depth ?? 0) + 1, isDiving: 'yes' })
        .expect(400);

      const after = await TCave.findOne(1);
      should(after.depth).equal(before.depth);
    });

    it('should not create an entrance when a flag is invalid', async () => {
      const count = await TEntrance.count();

      await supertest(sails.hooks.http.app)
        .post('/api/v1/entrances')
        .set('Authorization', token)
        .send({
          name: { text: 'Boolean params', language: 'fra' },
          cave: 1,
          latitude: 1,
          longitude: 1,
          hasBat: 'yes',
        })
        .expect(400);

      should(await TEntrance.count()).equal(count);
    });
  });

  describe('accepted encodings and defaults', () => {
    const app = () => supertest(sails.hooks.http.app);

    it('should list the review queue for isValidated=0 as for isValidated=false', async () => {
      // Other test files leave pending documents behind when run in the same
      // database, so compare the two encodings rather than an exact list.
      const pending = await TDocument.create({
        author: 1,
        type: 1,
        isValidated: false,
      }).fetch();
      const ids = async (value) => {
        const res = await app()
          .get('/api/v1/documents')
          .query({
            isValidated: value,
            limit: 100,
            sortBy: 'id',
            orderBy: 'DESC',
          })
          .set('Authorization', token);
        should([200, 206]).containEql(res.status);
        return res.body.documents.map((d) => d.id).sort((a, b) => a - b);
      };

      try {
        const queue = await ids('false');
        should(queue).containEql(pending.id);
        should(await ids('0')).eql(queue);
        should(await ids('true')).not.containEql(pending.id);
      } finally {
        await TDocument.destroyOne({ id: pending.id });
      }
    });

    it('should include deleted bibliographic records for includeDeleted=1 only', async () => {
      const count = async (query) =>
        (
          await app()
            .get('/api/v1/bibliographic-metadata/count')
            .query(query)
            .set('Authorization', token)
            .expect(200)
        ).body.count;

      // Fixtures: 20 registered records and 1 deleted one
      should(await count({})).equal(20);
      should(await count({ includeDeleted: '0' })).equal(20);
      should(await count({ includeDeleted: '1' })).equal(21);
    });

    it('should return the pending modification for requireUpdate=1', async () => {
      const doc = await TDocument.create({
        author: 1,
        type: 1,
        license: 1,
        isValidated: false,
        modifiedDocJson: {
          reviewerId: 2,
          documentData: { type: 17 },
          descriptionData: {},
        },
      }).fetch();

      const typeOf = async (requireUpdate) => {
        const res = await app()
          .get(`/api/v1/documents/${doc.id}`)
          .query({ requireUpdate })
          .set('Authorization', token)
          .expect(200);
        return res.body.type;
      };

      try {
        // Type 17 is Issue, type 1 Collection
        should(await typeOf('1')).equal('Issue');
        should(await typeOf('0')).equal('Collection');
      } finally {
        await TDocument.destroyOne({ id: doc.id });
      }
    });

    describe('writes', () => {
      afterEach(async () => {
        await TEntrance.updateOne(1).set({ hasBat: false, isTouristic: false });
        await TCave.updateOne(1).set({ isDiving: false });
      });

      it('should store an entrance flag sent as "1" and leave null ones untouched', async () => {
        await TEntrance.updateOne(1).set({ isTouristic: true });

        await app()
          .put('/api/v1/entrances/1')
          .set('Authorization', token)
          .send({ hasBat: '1', isTouristic: null })
          .expect(200);

        const entrance = await TEntrance.findOne(1);
        should(entrance.hasBat).be.true();
        should(entrance.isTouristic).be.true();
      });

      it('should store isDiving sent as the string "true"', async () => {
        await app()
          .put('/api/v1/caves/1')
          .set('Authorization', token)
          .send({ isDiving: 'true' })
          .expect(200);

        should((await TCave.findOne(1)).isDiving).be.true();
      });
    });

    it('should accept "1" and "0" for notification preferences', async () => {
      const patch = (body) =>
        app()
          .patch('/api/v1/account/notifications')
          .set('Authorization', token)
          .send(body)
          .expect(200);

      const on = await patch({
        alert_for_news: '1',
        send_notification_by_email: '1',
      });
      should(on.body.alert_for_news).be.true();
      should(on.body.send_notification_by_email).be.true();

      const off = await patch({
        alert_for_news: '0',
        send_notification_by_email: '0',
      });
      should(off.body.alert_for_news).be.false();
      should(off.body.send_notification_by_email).be.false();
    });

    describe('reference lists', () => {
      // Fixtures: 2 of the 3 languages are preferred, 7 of the 19 document
      // types available.
      const listLanguages = async (query) =>
        (await app().get('/api/v1/languages').query(query).expect(200)).body
          .languages;
      const listTypes = async (query) =>
        (await app().get('/api/v1/documents/types').query(query).expect(200))
          .body.documentTypes;

      it('should list preferred languages by default, also for an empty isPrefered', async () => {
        const preferred = await listLanguages({});
        should(preferred).have.length(2);
        preferred.forEach((language) => should(language.isPrefered).be.true());
        should(await listLanguages({ isPrefered: '' })).have.length(2);
        should(await listLanguages({ isPrefered: '1' })).have.length(2);
      });

      it('should list the other languages for isPrefered=0 and isPrefered=false', async () => {
        const others = await listLanguages({ isPrefered: '0' });
        should(others).have.length(1);
        should(others[0].isPrefered).be.false();
        should(await listLanguages({ isPrefered: 'false' })).eql(others);
      });

      it('should filter document types only when isAvailable is given', async () => {
        should(await listTypes({})).have.length(19);
        should(await listTypes({ isAvailable: '' })).have.length(19);

        const available = await listTypes({ isAvailable: '1' });
        should(available).have.length(7);
        available.forEach((type) => should(type.isAvailable).be.true());
        should(await listTypes({ isAvailable: 'true' })).eql(available);

        const unavailable = await listTypes({ isAvailable: '0' });
        should(unavailable).have.length(12);
        unavailable.forEach((type) => should(type.isAvailable).be.false());
      });
    });

    describe('PATCH /account sendNotificationByEmail', () => {
      const patchAccount = (body) =>
        app().patch('/api/v1/account').set('Authorization', token).send(body);
      const storedFlag = async () =>
        (await TCaver.findOne({ mail: 'all1@all1.com' }))
          .sendNotificationByEmail;
      let original;

      before(async () => {
        original = await TCaver.findOne({ mail: 'all1@all1.com' });
      });

      after(async () => {
        await TCaver.updateOne({ mail: 'all1@all1.com' }).set({
          activationCode: original.activationCode,
          mailIsValid: original.mailIsValid,
          name: original.name,
          pendingMail: original.pendingMail,
          sendNotificationByEmail: original.sendNotificationByEmail,
        });
      });

      it('should store the string encodings', async () => {
        await patchAccount({ sendNotificationByEmail: '1' }).expect(204);
        should(await storedFlag()).be.true();
        await patchAccount({ sendNotificationByEmail: 'false' }).expect(204);
        should(await storedFlag()).be.false();
        await patchAccount({ sendNotificationByEmail: true }).expect(204);
        should(await storedFlag()).be.true();
      });

      it('should leave the preference untouched when it is null', async () => {
        await patchAccount({ sendNotificationByEmail: true }).expect(204);

        await patchAccount({
          sendNotificationByEmail: null,
          name: 'Boolean params',
        }).expect(204);

        should(await storedFlag()).be.true();
      });

      it('should reject an invalid flag sent along with a pending email cancellation', async () => {
        const pending = {
          activationCode: 'boolean-params-code',
          mailIsValid: false,
          pendingMail: 'boolean-params-pending@example.com',
        };
        // Waterline renames the keys of the object passed to set().
        await TCaver.updateOne({ mail: 'all1@all1.com' }).set({ ...pending });

        const res = await patchAccount({
          email: 'all1@all1.com',
          sendNotificationByEmail: 'yes',
        }).expect(400);

        should(res.body.code).equal('E_BAD_REQUEST');
        should(res.body.metadata).containDeep({
          field: 'sendNotificationByEmail',
          value: 'yes',
        });
        const caver = await TCaver.findOne({ mail: 'all1@all1.com' });
        should(caver).containDeep(pending);
      });

      it('should not apply the other fields when the flag is invalid', async () => {
        const before = await TCaver.findOne({ mail: 'all1@all1.com' });

        await patchAccount({
          sendNotificationByEmail: 'yes',
          name: 'Should not be stored',
        }).expect(400);

        should((await TCaver.findOne({ mail: 'all1@all1.com' })).name).equal(
          before.name
        );
      });
    });
  });
});
