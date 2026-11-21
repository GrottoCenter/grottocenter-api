const supertest = require('supertest');
const should = require('should');
const sinon = require('sinon');
// Required at load time: dbSync is not a Sails service
const { planSync } = require('../../../../api/dbSync/searchDocuments');
const AuthTokenService = require('../../AuthTokenService');

// The same read-only validationStatus on every document representation (#2005)
describe('Document validationStatus', () => {
  let moderatorToken;
  let parent;
  const docs = {};
  const createdIds = [];

  const modification = (extra) => ({
    reviewerId: 1,
    documentData: {},
    descriptionData: { title: 'Proposed title', body: 'Proposed body' },
    ...extra,
  });

  // Each state, as the moderation endpoints leave it
  const STATES = {
    // A new submission
    pending: { isValidated: false, dateValidation: null },
    // An accepted document whose modification awaits approval
    modificationPending: {
      isValidated: false,
      dateValidation: null,
      validator: 1,
      modifiedDocJson: modification({ wasValidated: true }),
    },
    // The same, stored before modifiedDocJson.wasValidated existed: the
    // history holds the accepted version (created in before())
    legacyModificationPending: {
      isValidated: false,
      dateValidation: null,
      modifiedDocJson: modification(),
    },
    // A modification stored without the flag on a never-accepted submission
    legacyPending: {
      isValidated: false,
      dateValidation: null,
      modifiedDocJson: modification(),
    },
    // A refused submission
    rejected: {
      isValidated: false,
      dateValidation: new Date(),
      validator: 1,
      validationComment: 'Refused',
    },
    // A refused submission, corrected and resubmitted: it keeps its validator
    resubmitted: {
      isValidated: false,
      dateValidation: null,
      validator: 1,
      validationComment: 'Refused',
      modifiedDocJson: modification({ wasValidated: false }),
    },
    // An accepted document, or a refused modification of one
    validated: {
      isValidated: true,
      dateValidation: new Date(),
      validator: 1,
      validationComment: 'Accepted',
    },
  };

  const EXPECTED = {
    pending: 'pending',
    modificationPending: 'modificationPending',
    legacyModificationPending: 'modificationPending',
    legacyPending: 'pending',
    rejected: 'rejected',
    resubmitted: 'pending',
    validated: 'validated',
  };

  const createDocument = async (fields) => {
    const doc = await TDocument.create({
      author: 1,
      type: 1,
      license: 1,
      ...fields,
    }).fetch();
    createdIds.push(doc.id);
    return doc;
  };

  const get = (url) =>
    supertest(sails.hooks.http.app)
      .get(url)
      .set('Authorization', moderatorToken)
      .set('Accept', 'application/json');

  before(async () => {
    moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
    parent = await createDocument({
      isValidated: true,
      dateValidation: new Date(),
    });
    for (const [state, fields] of Object.entries(STATES)) {
      // eslint-disable-next-line no-await-in-loop
      docs[state] = await createDocument({ ...fields, parent: parent.id });
    }
    await HDocument.create({
      id: '2030-01-01T00:00:00.000Z',
      t_id: docs.legacyModificationPending.id,
      author: 1,
      type: 1,
      license: 1,
      isValidated: true,
    });
    await JDocumentEntrance.createEach(
      Object.values(docs).map((d) => ({ document: d.id, entrance: 1 }))
    );
  });

  afterEach(() => sinon.restore());

  after(async () => {
    await JDocumentEntrance.destroy({ document: createdIds });
    await HDocument.destroy({ t_id: createdIds });
    await TDocument.destroy({ id: createdIds });
  });

  describe('GET /documents/:id', () => {
    Object.entries(EXPECTED).forEach(([state, expected]) => {
      it(`returns ${expected} for a ${state} document`, async () => {
        const res = await get(`/api/v1/documents/${docs[state].id}`).expect(
          200
        );
        should(res.body.validationStatus).equal(expected);
      });
    });

    it('keeps the existing moderation fields', async () => {
      const res = await get(`/api/v1/documents/${docs.rejected.id}`).expect(
        200
      );
      should(res.body.isValidated).be.false();
      should(res.body.dateValidation).not.be.null();
      should(res.body.validatorComment).equal('Refused');
      should(res.body.validator).have.property('id', 1);
    });

    it('returns the status of the embedded parent', async () => {
      const child = await createDocument({
        isValidated: true,
        dateValidation: new Date(),
        parent: docs.modificationPending.id,
      });
      const res = await get(`/api/v1/documents/${child.id}`).expect(200);
      should(res.body.validationStatus).equal('validated');
      should(res.body.parent.validationStatus).equal('modificationPending');
    });
  });

  describe('GET /documents/:id?requireUpdate=true', () => {
    [
      'modificationPending',
      'legacyModificationPending',
      'legacyPending',
      'resubmitted',
    ].forEach((state) => {
      it(`keeps the ${EXPECTED[state]} status of a ${state} document on its proposed version`, async () => {
        const res = await get(
          `/api/v1/documents/${docs[state].id}?requireUpdate=true`
        ).expect(200);
        should(res.body.title).equal('Proposed title');
        should(res.body.validationStatus).equal(EXPECTED[state]);
      });
    });
  });

  describe('GET /documents', () => {
    const list = async (query) => {
      const res = await get('/api/v1/documents')
        .query({ sortBy: 'id', orderBy: 'DESC', limit: 50, ...query })
        .expect((r) => should([200, 206]).containEql(r.status));
      return new Map(
        res.body.documents.map((d) => [Number(d.id), d.validationStatus])
      );
    };

    it('returns the status of each document of the moderation queue', async () => {
      const statuses = await list({ isValidated: false });
      [
        'pending',
        'modificationPending',
        'legacyModificationPending',
        'legacyPending',
        'resubmitted',
      ].forEach((state) => {
        should(statuses.get(docs[state].id)).equal(EXPECTED[state]);
      });
      // The refused submissions stay out of the queue
      should(statuses.has(docs.rejected.id)).be.false();
    });

    it('resolves the legacy statuses in one history query for the page', async () => {
      const find = sinon.spy(HDocument, 'find');
      const count = sinon.spy(HDocument, 'count');
      await list({ isValidated: false });
      should(find.callCount).equal(1);
      should(count.callCount).equal(0);
    });

    it('returns validated for an accepted document', async () => {
      const statuses = await list({});
      should(statuses.get(docs.validated.id)).equal('validated');
    });
  });

  describe('GET /documents/:id/children', () => {
    it('returns the status of each child', async () => {
      const res = await get(`/api/v1/documents/${parent.id}/children`).expect(
        200
      );
      const statuses = new Map(
        res.body.documents.map((d) => [d.id, d.validationStatus])
      );
      Object.entries(EXPECTED).forEach(([state, expected]) => {
        should(statuses.get(docs[state].id)).equal(expected);
      });
    });
  });

  describe('documents attached to an entrance', () => {
    it('returns the status of each listed document', async () => {
      const res = await get('/api/v1/entrances/1').expect(200);
      const statuses = new Map(
        res.body.documents.map((d) => [d.id, d.validationStatus])
      );
      Object.entries(EXPECTED)
        // A refused submission is not shown on the entities (#1907)
        .filter(([state]) => state !== 'rejected')
        .forEach(([state, expected]) => {
          should(statuses.get(docs[state].id)).equal(expected);
        });
    });
  });

  describe('search', () => {
    it('indexes the same status as the API, and no refused submission', async () => {
      const ids = Object.values(docs).map((d) => d.id);
      const { documents, removedIds } = await planSync('documents', ids);
      const indexed = new Map(documents.map((d) => [d.id, d.validationStatus]));
      Object.entries(EXPECTED)
        .filter(([state]) => state !== 'rejected')
        .forEach(([state, expected]) => {
          should(indexed.get(docs[state].id)).equal(expected);
        });
      should(removedIds).eql([docs.rejected.id]);
    });
  });

  describe('GET /documents/:id/snapshots', () => {
    let doc;

    before(async () => {
      doc = await createDocument({
        isValidated: true,
        dateValidation: new Date(),
      });
      const snapshot = (date, fields) =>
        HDocument.create({
          id: date,
          t_id: doc.id,
          author: 1,
          type: 1,
          license: 1,
          ...fields,
        });
      // Submitted, refused, resubmitted, accepted, then modified. Created out
      // of order: each version is compared with the earlier ones.
      const undecided = { isValidated: false, dateValidation: null };
      await snapshot('2030-01-05T00:00:00.000Z', undecided);
      await snapshot('2030-01-01T00:00:00.000Z', undecided);
      await snapshot('2030-01-02T00:00:00.000Z', {
        isValidated: false,
        dateValidation: '2030-01-02T00:00:00.000Z',
      });
      await snapshot('2030-01-03T00:00:00.000Z', undecided);
      await snapshot('2030-01-04T00:00:00.000Z', {
        isValidated: true,
        dateValidation: '2030-01-04T00:00:00.000Z',
      });
    });

    it('describes each historical version, not the current document', async () => {
      const res = await get(`/api/v1/documents/${doc.id}/snapshots`).expect(
        200
      );
      const statuses = Object.fromEntries(
        res.body.documents.map((d) => [
          new Date(d.id).toISOString().slice(0, 10),
          d.validationStatus,
        ])
      );
      should(statuses).eql({
        '2030-01-01': 'pending',
        '2030-01-02': 'rejected',
        '2030-01-03': 'pending',
        '2030-01-04': 'validated',
        '2030-01-05': 'modificationPending',
      });
    });
  });
});
