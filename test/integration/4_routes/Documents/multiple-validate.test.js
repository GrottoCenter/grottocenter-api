const supertest = require('supertest');
const should = require('should');
const sinon = require('sinon');
const AuthTokenService = require('../../AuthTokenService');

describe('Document multiple-validate', () => {
  let userToken;
  let moderatorToken;
  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
    moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
  });

  describe('Multiple validate', () => {
    it('should return 403 when user is not a moderator', (done) => {
      supertest(sails.hooks.http.app)
        .put('/api/v1/documents/validate')
        .send({ documents: [] })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(403, done);
    });

    it('should return 400 when refusing without comment', (done) => {
      supertest(sails.hooks.http.app)
        .put('/api/v1/documents/validate')
        .send({
          documents: [{ id: 1, isValidated: 'false' }],
        })
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(400, done);
    });

    it('should validate empty list of documents', (done) => {
      supertest(sails.hooks.http.app)
        .put('/api/v1/documents/validate')
        .send({ documents: [] })
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(204, done);
    });

    it('should validate a single document', async () => {
      const doc = await TDocument.create({
        author: 1,
        type: 1,
        license: 1,
        isValidated: false,
      }).fetch();

      await supertest(sails.hooks.http.app)
        .put('/api/v1/documents/validate')
        .send({
          documents: [{ id: doc.id, isValidated: 'true' }],
        })
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(204);

      const updated = await TDocument.findOne(doc.id);
      should(updated.isValidated).be.true();
    });

    it('should validate multiple documents', async () => {
      const doc1 = await TDocument.create({
        author: 1,
        type: 1,
        license: 1,
        isValidated: false,
      }).fetch();
      const doc2 = await TDocument.create({
        author: 1,
        type: 1,
        license: 1,
        isValidated: false,
      }).fetch();

      await supertest(sails.hooks.http.app)
        .put('/api/v1/documents/validate')
        .send({
          documents: [
            { id: doc1.id, isValidated: 'true' },
            { id: doc2.id, isValidated: 'true' },
          ],
        })
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(204);

      const updated1 = await TDocument.findOne(doc1.id);
      const updated2 = await TDocument.findOne(doc2.id);
      should(updated1.isValidated).be.true();
      should(updated2.isValidated).be.true();
    });

    it('should reject a document with comment', async () => {
      const doc = await TDocument.create({
        author: 1,
        type: 1,
        license: 1,
        isValidated: false,
      }).fetch();

      await supertest(sails.hooks.http.app)
        .put('/api/v1/documents/validate')
        .send({
          documents: [
            {
              id: doc.id,
              isValidated: 'false',
              validationComment: 'Rejected for testing',
            },
          ],
        })
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(204);

      const updated = await TDocument.findOne(doc.id);
      should(updated.isValidated).be.true();
      should(updated.validationComment).equal('Rejected for testing');
    });

    it('should validate document with modifiedDocJson', async () => {
      const desc = await TDescription.create({
        author: 1,
        title: 'Original',
        body: 'Original body',
      }).fetch();

      const doc = await TDocument.create({
        author: 1,
        type: 1,
        license: 1,
        isValidated: false,
        descriptions: [desc.id],
        modifiedDocJson: {
          reviewerId: 2,
          documentData: { type: 17 },
          descriptionData: { title: 'Updated', body: 'Updated body' },
        },
      }).fetch();

      await supertest(sails.hooks.http.app)
        .put('/api/v1/documents/validate')
        .send({
          documents: [{ id: doc.id, isValidated: 'true' }],
        })
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(204);

      const updated = await TDocument.findOne(doc.id);
      should(updated.isValidated).be.true();
      should(updated.modifiedDocJson).be.null();
    });

    it('should validate document with modifiedDocJson containing massifs as objects', async () => {
      const massif = await TMassif.create({ author: 1 }).fetch();

      const desc = await TDescription.create({
        author: 1,
        title: 'Original',
        body: 'Original body',
      }).fetch();

      const doc = await TDocument.create({
        author: 1,
        type: 1,
        license: 1,
        isValidated: false,
        descriptions: [desc.id],
        modifiedDocJson: {
          reviewerId: 2,
          documentData: {
            type: 17,
            massifs: [{ id: massif.id, name: 'Some massif' }],
          },
          descriptionData: { title: 'Updated', body: 'Updated body' },
        },
      }).fetch();

      await supertest(sails.hooks.http.app)
        .put('/api/v1/documents/validate')
        .send({
          documents: [{ id: doc.id, isValidated: 'true' }],
        })
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(204);

      const updated = await TDocument.findOne(doc.id).populate('massifs');
      should(updated.isValidated).be.true();
      should(updated.modifiedDocJson).be.null();
      should(updated.massifs).be.an.Array();
      should(updated.massifs.map((m) => m.id)).containDeep([massif.id]);

      const updatedDesc = await TDescription.findOne(desc.id);
      should(updatedDesc.title).equal('Updated');
      should(updatedDesc.body).equal('Updated body');
    });

    describe('Collection replace behaviour', () => {
      // Track all records created by the tests in this block so they can be
      // cleaned up after the suite — prevents cross-shard fixture pollution.
      const createdDocIds = [];
      const createdDescIds = [];

      after(async () => {
        if (createdDocIds.length > 0)
          await TDocument.destroy({ id: createdDocIds });
        if (createdDescIds.length > 0)
          await TDescription.destroy({ id: createdDescIds });
      });

      it('should replace authors collection when validating a document with modifiedDocJson', async () => {
        const desc = await TDescription.create({
          author: 1,
          title: 'Original',
          body: 'Original body',
        }).fetch();
        createdDescIds.push(desc.id);

        // Document starts with caver 1 as an author
        const doc = await TDocument.create({
          author: 1,
          type: 1,
          license: 1,
          isValidated: false,
          authors: [1],
          descriptions: [desc.id],
          modifiedDocJson: {
            reviewerId: 2,
            // Editor requests: remove caver 1, add caver 6 as the sole author
            documentData: {
              type: 1,
              authors: [6],
            },
            descriptionData: { title: 'Original', body: 'Original body' },
          },
        }).fetch();
        createdDocIds.push(doc.id);

        await supertest(sails.hooks.http.app)
          .put('/api/v1/documents/validate')
          .send({
            documents: [{ id: doc.id, isValidated: 'true' }],
          })
          .set('Authorization', moderatorToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(204);

        const updated = await TDocument.findOne(doc.id).populate('authors');
        // Only caver 6 should be listed; caver 1 must have been removed
        const authorIds = updated.authors.map((a) => a.id);
        should(authorIds).containEql(6);
        should(authorIds).not.containEql(1);
      });

      it('should clear authors and replace with authorsOrganization when validating', async () => {
        const desc = await TDescription.create({
          author: 1,
          title: 'Org only',
          body: 'Body',
        }).fetch();
        createdDescIds.push(desc.id);

        // Document starts with caver 1 as a person author and no grotto authors
        const doc = await TDocument.create({
          author: 1,
          type: 1,
          license: 1,
          isValidated: false,
          authors: [1],
          descriptions: [desc.id],
          modifiedDocJson: {
            reviewerId: 2,
            // Editor wants to remove all person authors and replace with grotto 1
            documentData: {
              type: 1,
              authors: [],
              authorsOrganization: [1],
            },
            descriptionData: { title: 'Org only', body: 'Body' },
          },
        }).fetch();
        createdDocIds.push(doc.id);

        await supertest(sails.hooks.http.app)
          .put('/api/v1/documents/validate')
          .send({
            documents: [{ id: doc.id, isValidated: 'true' }],
          })
          .set('Authorization', moderatorToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(204);

        const updated = await TDocument.findOne(doc.id)
          .populate('authors')
          .populate('authorsOrganization');
        // All person authors must have been cleared
        should(updated.authors).have.length(0);
        // Grotto 1 must be present
        const grottoIds = updated.authorsOrganization.map((g) => g.id);
        should(grottoIds).containEql(1);
      });

      it('should leave untouched collections unchanged when field is absent from modifiedDocJson', async () => {
        const desc = await TDescription.create({
          author: 1,
          title: 'Untouched',
          body: 'Body',
        }).fetch();
        createdDescIds.push(desc.id);

        const doc = await TDocument.create({
          author: 1,
          type: 1,
          license: 1,
          isValidated: false,
          authors: [1],
          descriptions: [desc.id],
          modifiedDocJson: {
            reviewerId: 2,
            // Only type is changed; authors is intentionally absent
            documentData: { type: 17 },
            descriptionData: { title: 'Untouched', body: 'Body' },
          },
        }).fetch();
        createdDocIds.push(doc.id);

        await supertest(sails.hooks.http.app)
          .put('/api/v1/documents/validate')
          .send({
            documents: [{ id: doc.id, isValidated: 'true' }],
          })
          .set('Authorization', moderatorToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(204);

        const updated = await TDocument.findOne(doc.id).populate('authors');
        // authors was not touched — caver 1 must still be there
        const authorIds = updated.authors.map((a) => a.id);
        should(authorIds).containEql(1);
      });

      it('should auto-reject modifiedDocJson that would create a parent cycle at approval time', async () => {
        // Set up: docA is the parent of docB.
        // User submits a modification on docA to set its parent to docB.
        // This passes validation at submission time if docB is not yet
        // an ancestor of docA. But by approval time the hierarchy has not
        // changed — the cycle is detected and the modification is rejected.
        const desc = await TDescription.create({
          author: 1,
          title: 'Cycle test',
          body: 'Body',
        }).fetch();
        createdDescIds.push(desc.id);

        // docA — will have a pending modification that tries to set parent = docB
        const docA = await TDocument.create({
          author: 1,
          type: 1,
          license: 1,
          isValidated: false,
          descriptions: [desc.id],
        }).fetch();
        createdDocIds.push(docA.id);

        // docB — child of docA
        const docB = await TDocument.create({
          author: 1,
          type: 17,
          license: 1,
          parent: docA.id,
          isValidated: true,
        }).fetch();
        createdDocIds.push(docB.id);

        // Stage a pending modification on docA that would create cycle docA → docB → docA
        await TDocument.updateOne(docA.id).set({
          modifiedDocJson: {
            reviewerId: 2,
            documentData: { type: 17, parent: docB.id },
            descriptionData: { title: 'Cycle test', body: 'Body' },
          },
        });

        // Track notifications created during validation
        const beforeNotifIds = (await TNotification.find().select(['id'])).map(
          (n) => n.id
        );

        await supertest(sails.hooks.http.app)
          .put('/api/v1/documents/validate')
          .send({
            documents: [{ id: docA.id, isValidated: 'true' }],
          })
          .set('Authorization', moderatorToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(204);

        const updated = await TDocument.findOne(docA.id);
        // modifiedDocJson must be cleared (auto-rejected)
        should(updated.modifiedDocJson).be.null();
        // The cyclic parent must NOT have been written
        should(updated.parent).not.equal(docB.id);
        // The auto-rejection comment must be set
        should(updated.validationComment).match(/auto-rejected/i);
        // The document must return to its last validated state, not vanish:
        // find-all.js returns isValidated true for the default list and
        // isValidated false only when dateValidation is null, so the
        // false + dateValidation-set combination is in neither list.
        should(updated.isValidated).be.true();
        should(updated.dateValidation).be.ok();

        // No VALIDATE notification must have been sent — only a REJECT one
        const afterNotifIds = (await TNotification.find().select(['id'])).map(
          (n) => n.id
        );
        const newNotifIds = afterNotifIds.filter(
          (id) => !beforeNotifIds.includes(id)
        );
        const VALIDATE_TYPE_ID = 4;
        const REJECT_TYPE_ID = 7;
        const validateNotif = newNotifIds.length
          ? await TNotification.findOne({
              id: newNotifIds,
              notificationType: VALIDATE_TYPE_ID,
            })
          : null;
        should(validateNotif).be.undefined();

        // A REJECT author notification must have been sent with the auto-rejection reason
        const rejectNotif = newNotifIds.length
          ? await TNotification.findOne({
              id: newNotifIds,
              notified: 1,
              document: docA.id,
              notificationType: REJECT_TYPE_ID,
            })
          : null;
        should(rejectNotif).not.be.undefined();
      });

      it('should drop an author deleted since submission and apply the rest of the modification', async () => {
        // A caver that exists when the modification is submitted and is deleted
        // before the moderator gets to it. replaceCollection used to fail on
        // j_document_caver_author_t_caver_fk and return 500 forever.
        //
        // #1815 requires the validation to succeed with the vanished member
        // dropped: refusing the whole edit would punish the contributor for an
        // administrative action they had no part in. So the surviving author, the
        // description change and the scalar change must all be applied.
        const doomedCaver = await TCaver.create({
          nickname: `Doomed author ${Date.now()}`,
          mail: `doomed-${Date.now()}@example.com`,
          password: 'hashed',
          language: '000',
        }).fetch();
        const doomedCaverId = doomedCaver.id;

        const desc = await TDescription.create({
          author: 1,
          title: 'Stale author',
          body: 'Body',
        }).fetch();
        createdDescIds.push(desc.id);

        const doc = await TDocument.create({
          author: 1,
          type: 1,
          license: 1,
          isValidated: false,
          authors: [1],
          descriptions: [desc.id],
          modifiedDocJson: {
            reviewerId: 2,
            // Caver 6 survives, the doomed one does not.
            documentData: { type: 1, authors: [6, doomedCaverId] },
            descriptionData: {
              title: 'Applied despite the dropped author',
              body: 'New body',
            },
          },
        }).fetch();
        createdDocIds.push(doc.id);

        await TCaver.destroyOne(doomedCaverId);

        const beforeNotifIds = (await TNotification.find().select(['id'])).map(
          (n) => n.id
        );

        await supertest(sails.hooks.http.app)
          .put('/api/v1/documents/validate')
          .send({
            documents: [{ id: doc.id, isValidated: 'true' }],
          })
          .set('Authorization', moderatorToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(204);

        const updated = await TDocument.findOne(doc.id).populate('authors');
        should(updated.modifiedDocJson).be.null();
        should(updated.isValidated).be.true();
        should(updated.dateValidation).be.ok();
        // Not rejected — the edit went in.
        should(updated.validationComment ?? '').not.match(/auto-rejected/i);

        // The surviving member was applied and the vanished one dropped. Caver 1
        // is gone because the snapshot replaced the collection, which is the
        // contributor's intent; caver 6 is what they asked for minus the
        // impossible part.
        should(updated.authors.map((a) => a.id)).deepEqual([6]);

        // The rest of the modification landed too — this is what auto-rejecting
        // used to discard.
        const updatedDesc = await TDescription.findOne({ document: doc.id });
        should(updatedDesc.title).equal('Applied despite the dropped author');
        should(updatedDesc.body).equal('New body');

        // Reachable in the default list, absent from the moderation queue, using
        // the exact clauses find-all.js builds.
        const inDefaultList = await TDocument.count().where({
          and: [{ isValidated: true, isDeleted: false }, { id: doc.id }],
        });
        const inModerationQueue = await TDocument.count().where({
          and: [
            { isValidated: false, isDeleted: false },
            { dateValidation: null },
            { id: doc.id },
          ],
        });
        should(inDefaultList).equal(1);
        should(inModerationQueue).equal(0);

        // A successful validation notifies the author with VALIDATE, not REJECT.
        const afterNotifIds = (await TNotification.find().select(['id'])).map(
          (n) => n.id
        );
        const newNotifIds = afterNotifIds.filter(
          (id) => !beforeNotifIds.includes(id)
        );
        const VALIDATE_TYPE_ID = 4;
        const REJECT_TYPE_ID = 7;
        const rejectNotif = newNotifIds.length
          ? await TNotification.findOne({
              id: newNotifIds,
              notificationType: REJECT_TYPE_ID,
            })
          : null;
        should(rejectNotif).be.undefined();
        const validateNotif = newNotifIds.length
          ? await TNotification.findOne({
              id: newNotifIds,
              notified: 1,
              document: doc.id,
              notificationType: VALIDATE_TYPE_ID,
            })
          : null;
        should(validateNotif).not.be.undefined();
      });

      it('should clear a collection whose every member was deleted since submission', async () => {
        // The degenerate case of the drop policy: nothing survives, so the
        // collection ends up empty. That is still the snapshot's intent minus the
        // impossible part, and it must not be mistaken for "field not sent".
        const doomedCaver = await TCaver.create({
          nickname: `Only author ${Date.now()}`,
          mail: `only-author-${Date.now()}@example.com`,
          password: 'hashed',
          language: '000',
        }).fetch();
        const doomedCaverId = doomedCaver.id;

        const desc = await TDescription.create({
          author: 1,
          title: 'All authors gone',
          body: 'Body',
        }).fetch();
        createdDescIds.push(desc.id);

        const doc = await TDocument.create({
          author: 1,
          type: 1,
          license: 1,
          isValidated: false,
          authors: [1],
          descriptions: [desc.id],
          modifiedDocJson: {
            reviewerId: 2,
            documentData: { type: 1, authors: [doomedCaverId] },
            descriptionData: { title: 'All authors gone', body: 'Body' },
          },
        }).fetch();
        createdDocIds.push(doc.id);

        await TCaver.destroyOne(doomedCaverId);

        await supertest(sails.hooks.http.app)
          .put('/api/v1/documents/validate')
          .send({
            documents: [{ id: doc.id, isValidated: 'true' }],
          })
          .set('Authorization', moderatorToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(204);

        const updated = await TDocument.findOne(doc.id).populate('authors');
        should(updated.modifiedDocJson).be.null();
        should(updated.isValidated).be.true();
        should(updated.validationComment ?? '').not.match(/auto-rejected/i);
        should(updated.authors).have.length(0);
      });

      // A snapshot can hold a value that is numeric but outside int4 — the
      // ordinary update path will persist one, since nothing validated the
      // domain on the way in. Looking it up makes the adapter throw, so this
      // 500'd on every retry: the same permanently-stuck document the guard
      // exists to prevent, reached by a different route.
      const outOfDomainIds = [
        ['fractional', 1.5],
        ['beyond int4', 2147483648],
      ];

      outOfDomainIds.forEach(([label, badId]) => {
        it(`should drop a snapshot author id that is ${label}`, async () => {
          const desc = await TDescription.create({
            author: 1,
            title: 'Out of domain',
            body: 'Body',
          }).fetch();
          createdDescIds.push(desc.id);

          const doc = await TDocument.create({
            author: 1,
            type: 1,
            license: 1,
            isValidated: false,
            authors: [1],
            descriptions: [desc.id],
            modifiedDocJson: {
              reviewerId: 2,
              documentData: { type: 1, authors: [6, badId] },
              descriptionData: { title: 'Out of domain', body: 'Body' },
            },
          }).fetch();
          createdDocIds.push(doc.id);

          await supertest(sails.hooks.http.app)
            .put('/api/v1/documents/validate')
            .send({ documents: [{ id: doc.id, isValidated: 'true' }] })
            .set('Authorization', moderatorToken)
            .set('Content-type', 'application/json')
            .set('Accept', 'application/json')
            .expect(204);

          const updated = await TDocument.findOne(doc.id).populate('authors');
          should(updated.modifiedDocJson).be.null();
          should(updated.isValidated).be.true();
          should(updated.validationComment ?? '').not.match(/auto-rejected/i);
          // The unusable id is dropped, the valid one applied.
          should(updated.authors.map((a) => a.id)).deepEqual([6]);
        });
      });

      // Regression guard for the blank-padding trap. In production
      // t_subject.code is bpchar(8) and node-postgres returns it padded, so a
      // snapshot stores subject code '1.0' as '1.0     '. If the existence check
      // compares without trimming, that valid code looks missing and the whole
      // modification gets auto-rejected instead of applied.
      it('should apply a modification whose subject code is blank-padded', async () => {
        const desc = await TDescription.create({
          author: 1,
          title: 'Padded subject',
          body: 'Body',
        }).fetch();
        createdDescIds.push(desc.id);

        const doc = await TDocument.create({
          author: 1,
          type: 1,
          license: 1,
          isValidated: false,
          descriptions: [desc.id],
          modifiedDocJson: {
            reviewerId: 2,
            documentData: { type: 1, subjects: ['1.0     '] },
            descriptionData: { title: 'Padded subject', body: 'Body' },
          },
        }).fetch();
        createdDocIds.push(doc.id);

        await supertest(sails.hooks.http.app)
          .put('/api/v1/documents/validate')
          .send({
            documents: [{ id: doc.id, isValidated: 'true' }],
          })
          .set('Authorization', moderatorToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(204);

        const updated = await TDocument.findOne(doc.id).populate('subjects');
        should(updated.modifiedDocJson).be.null();
        should(updated.isValidated).be.true();
        // Not auto-rejected: the subject association was actually written.
        should(updated.subjects.map((s) => s.id.trim())).deepEqual(['1.0']);
      });

      // The production scenario from #1815: a five-document batch containing one
      // document whose snapshot named a deleted caver returned 500 and the
      // moderator had to bisect by hand.
      it('should validate a whole batch when one document has a vanished member', async () => {
        const doomedCaver = await TCaver.create({
          nickname: `Doomed batch author ${Date.now()}`,
          mail: `doomed-batch-${Date.now()}@example.com`,
          password: 'hashed',
          language: '000',
        }).fetch();
        const doomedCaverId = doomedCaver.id;

        const staleDesc = await TDescription.create({
          author: 1,
          title: 'Stale',
          body: 'Body',
        }).fetch();
        createdDescIds.push(staleDesc.id);

        const staleDoc = await TDocument.create({
          author: 1,
          type: 1,
          license: 1,
          isValidated: false,
          descriptions: [staleDesc.id],
          modifiedDocJson: {
            reviewerId: 2,
            documentData: { type: 1, authors: [doomedCaverId] },
            descriptionData: { title: 'Stale', body: 'Body' },
          },
        }).fetch();
        createdDocIds.push(staleDoc.id);

        await TCaver.destroyOne(doomedCaverId);

        const cleanDoc = await TDocument.create({
          author: 1,
          type: 1,
          license: 1,
          isValidated: false,
        }).fetch();
        createdDocIds.push(cleanDoc.id);

        await supertest(sails.hooks.http.app)
          .put('/api/v1/documents/validate')
          .send({
            documents: [
              { id: staleDoc.id, isValidated: 'true' },
              { id: cleanDoc.id, isValidated: 'true' },
            ],
          })
          .set('Authorization', moderatorToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(204);

        const updatedStale = await TDocument.findOne(staleDoc.id).populate(
          'authors'
        );
        should(updatedStale.modifiedDocJson).be.null();
        should(updatedStale.isValidated).be.true();
        should(updatedStale.validationComment ?? '').not.match(
          /auto-rejected/i
        );
        should(updatedStale.authors).have.length(0);

        // The rest of the batch must still have been applied.
        const updatedClean = await TDocument.findOne(cleanDoc.id);
        should(updatedClean.isValidated).be.true();
      });

      // The window between resolveM2MMembers and the replaceCollection insert
      // cannot be hit from a test: the test schema carries no foreign keys, so a
      // real 23503 is unreachable here even though production raises one. The
      // violation is injected instead, which is what makes the retry testable at
      // all — see api/services/DocumentService.js isForeignKeyViolation for the
      // error shape being reproduced.
      describe('Concurrent delete during validation', () => {
        const FK_VIOLATION = Object.assign(
          new Error(
            'insert or update on table "j_document_caver_author" violates foreign key constraint "j_document_caver_author_t_caver_fk"'
          ),
          {
            raw: {
              code: '23503',
              constraint: 'j_document_caver_author_t_caver_fk',
              table: 'j_document_caver_author',
            },
          }
        );

        // Sails re-requires everything under api/ when it lifts, so the instance
        // a top-level `require` in this file captured is a stale copy that no
        // controller ever calls — stubbing it silently does nothing. Resolve the
        // service after the lift instead.
        let Service;
        before(() => {
          // eslint-disable-next-line global-require
          Service = require('../../../../api/services/DocumentService');
        });

        afterEach(() => {
          sinon.restore();
        });

        const seedPendingDoc = async () => {
          const desc = await TDescription.create({
            author: 1,
            title: 'Racing',
            body: 'Body',
          }).fetch();
          createdDescIds.push(desc.id);

          const doc = await TDocument.create({
            author: 1,
            type: 1,
            license: 1,
            isValidated: false,
            authors: [1],
            descriptions: [desc.id],
            modifiedDocJson: {
              reviewerId: 2,
              documentData: { type: 1, authors: [6] },
              descriptionData: { title: 'Racing applied', body: 'New body' },
            },
          }).fetch();
          createdDocIds.push(doc.id);
          return doc;
        };

        it('should retry and apply the modification when the first attempt loses the race', async () => {
          const doc = await seedPendingDoc();

          const original = Service.replaceM2MCollections;
          let calls = 0;
          sinon.stub(Service, 'replaceM2MCollections').callsFake((...args) => {
            calls += 1;
            if (calls === 1) return Promise.reject(FK_VIOLATION);
            return original.apply(Service, args);
          });

          await supertest(sails.hooks.http.app)
            .put('/api/v1/documents/validate')
            .send({ documents: [{ id: doc.id, isValidated: 'true' }] })
            .set('Authorization', moderatorToken)
            .set('Content-type', 'application/json')
            .set('Accept', 'application/json')
            .expect(204);

          should(calls).equal(2);

          const updated = await TDocument.findOne(doc.id).populate('authors');
          should(updated.isValidated).be.true();
          should(updated.modifiedDocJson).be.null();
          should(updated.validationComment ?? '').not.match(/auto-rejected/i);
          // The whole edit went in on the second pass — the first attempt's
          // writes were rolled back, so this also proves the retry re-applies
          // the scalar and description changes rather than half of them.
          should(updated.authors.map((a) => a.id)).deepEqual([6]);
          const updatedDesc = await TDescription.findOne({ document: doc.id });
          should(updatedDesc.title).equal('Racing applied');
        });

        it('should auto-reject after every attempt loses the race', async () => {
          const doc = await seedPendingDoc();

          const stub = sinon
            .stub(Service, 'replaceM2MCollections')
            .rejects(FK_VIOLATION);

          await supertest(sails.hooks.http.app)
            .put('/api/v1/documents/validate')
            .send({ documents: [{ id: doc.id, isValidated: 'true' }] })
            .set('Authorization', moderatorToken)
            .set('Content-type', 'application/json')
            .set('Accept', 'application/json')
            .expect(204);

          // Bounded: it must give up rather than retry forever.
          should(stub.callCount).equal(2);

          const updated = await TDocument.findOne(doc.id).populate('authors');
          should(updated.modifiedDocJson).be.null();
          should(updated.validationComment).match(/auto-rejected/i);
          // Last validated state intact, and still reachable in the default list.
          should(updated.authors.map((a) => a.id)).deepEqual([1]);
          should(updated.isValidated).be.true();
          const updatedDesc = await TDescription.findOne({ document: doc.id });
          should(updatedDesc.title).equal('Racing');
        });

        it('should keep propagating a database error that is not a foreign-key violation', async () => {
          const doc = await seedPendingDoc();

          // A connection failure must not be absorbed as "the member is gone":
          // auto-rejection clears modifiedDocJson, so that would destroy the
          // contributor's pending edit over a transient fault.
          const stub = sinon.stub(Service, 'replaceM2MCollections').rejects(
            Object.assign(new Error('connection terminated'), {
              raw: { code: '08006' },
            })
          );

          await supertest(sails.hooks.http.app)
            .put('/api/v1/documents/validate')
            .send({ documents: [{ id: doc.id, isValidated: 'true' }] })
            .set('Authorization', moderatorToken)
            .set('Content-type', 'application/json')
            .set('Accept', 'application/json')
            .expect(500);

          // No retry either — it is not a race.
          should(stub.callCount).equal(1);

          // The pending modification survives for a later attempt.
          const updated = await TDocument.findOne(doc.id);
          should(updated.modifiedDocJson).not.be.null();
          should(updated.isValidated).be.false();
        });

        // The drop is recorded nowhere but the log, so the log must not claim a
        // document was validated by an attempt whose transaction rolled back.
        describe('Drop logging', () => {
          const DROP_MESSAGE =
            /validated with vanished linked entities dropped/;

          const dropWarnings = (warn) =>
            warn
              .getCalls()
              .map((call) => String(call.args[0]))
              .filter((message) => DROP_MESSAGE.test(message));

          // Both cases need a snapshot that drops a member *and* a write that
          // fails, which the injected violation is the only way to arrange.
          const seedDoomedPendingDoc = async () => {
            const doomedCaver = await TCaver.create({
              nickname: `Doomed logging author ${Date.now()}`,
              mail: `doomed-logging-${Date.now()}@example.com`,
              password: 'hashed',
              language: '000',
            }).fetch();

            const desc = await TDescription.create({
              author: 1,
              title: 'Logging',
              body: 'Body',
            }).fetch();
            createdDescIds.push(desc.id);

            const doc = await TDocument.create({
              author: 1,
              type: 1,
              license: 1,
              isValidated: false,
              authors: [1],
              descriptions: [desc.id],
              modifiedDocJson: {
                reviewerId: 2,
                documentData: { type: 1, authors: [6, doomedCaver.id] },
                descriptionData: { title: 'Logging applied', body: 'New body' },
              },
            }).fetch();
            createdDocIds.push(doc.id);

            await TCaver.destroyOne(doomedCaver.id);
            return doc;
          };

          it('should log the drop once, from the attempt that committed', async () => {
            const doc = await seedDoomedPendingDoc();

            const original = Service.replaceM2MCollections;
            let calls = 0;
            sinon
              .stub(Service, 'replaceM2MCollections')
              .callsFake((...args) => {
                calls += 1;
                if (calls === 1) return Promise.reject(FK_VIOLATION);
                return original.apply(Service, args);
              });
            const warn = sinon.spy(sails.log, 'warn');

            await supertest(sails.hooks.http.app)
              .put('/api/v1/documents/validate')
              .send({ documents: [{ id: doc.id, isValidated: 'true' }] })
              .set('Authorization', moderatorToken)
              .set('Content-type', 'application/json')
              .set('Accept', 'application/json')
              .expect(204);

            should(calls).equal(2);
            // Not twice: the rolled-back attempt dropped the same member, but it
            // validated nothing.
            should(dropWarnings(warn)).have.length(1);

            const updated = await TDocument.findOne(doc.id).populate('authors');
            should(updated.authors.map((a) => a.id)).deepEqual([6]);
          });

          it('should not log a drop when no attempt commits', async () => {
            const doc = await seedDoomedPendingDoc();

            sinon.stub(Service, 'replaceM2MCollections').rejects(
              Object.assign(new Error('connection terminated'), {
                raw: { code: '08006' },
              })
            );
            const warn = sinon.spy(sails.log, 'warn');

            await supertest(sails.hooks.http.app)
              .put('/api/v1/documents/validate')
              .send({ documents: [{ id: doc.id, isValidated: 'true' }] })
              .set('Authorization', moderatorToken)
              .set('Content-type', 'application/json')
              .set('Accept', 'application/json')
              .expect(500);

            should(dropWarnings(warn)).be.empty();

            // Nothing was validated, so the snapshot still holds the member the
            // log would have claimed was dropped.
            const updated = await TDocument.findOne(doc.id);
            should(updated.modifiedDocJson).not.be.null();
          });
        });
      });
    });
  });

  describe('Author notifications', () => {
    // Moderator1 (caver ID 2) validates/rejects documents
    // VALIDATE type ID = 4, REJECT type ID = 7
    const VALIDATE_TYPE_ID = 4;
    const REJECT_TYPE_ID = 7;
    const createdNotificationIds = [];
    const createdDocumentIds = [];

    after(async () => {
      if (createdNotificationIds.length > 0) {
        await TNotification.destroy({ id: createdNotificationIds });
      }
      if (createdDocumentIds.length > 0) {
        await TDocument.destroy({ id: createdDocumentIds });
      }
    });

    const trackNotifications = async (callback) => {
      const beforeIds = (await TNotification.find().select(['id'])).map(
        (n) => n.id
      );
      await callback();
      const afterIds = (await TNotification.find().select(['id'])).map(
        (n) => n.id
      );
      const newIds = afterIds.filter((id) => !beforeIds.includes(id));
      createdNotificationIds.push(...newIds);
      return newIds;
    };

    it('should create a VALIDATE author notification when accepting a document via batch', async () => {
      const doc = await TDocument.create({
        author: 1,
        type: 1,
        license: 1,
        isValidated: false,
      }).fetch();
      createdDocumentIds.push(doc.id);

      const newIds = await trackNotifications(async () => {
        await supertest(sails.hooks.http.app)
          .put('/api/v1/documents/validate')
          .send({
            documents: [{ id: doc.id, isValidated: 'true' }],
          })
          .set('Authorization', moderatorToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(204);
      });

      const authorNotification = await TNotification.findOne({
        id: newIds,
        notified: 1,
        document: doc.id,
        notificationType: VALIDATE_TYPE_ID,
      });
      should(authorNotification).not.be.undefined();
      should(authorNotification.notifier).equal(2);
    });

    it('should create a REJECT author notification when rejecting a document via batch', async () => {
      const doc = await TDocument.create({
        author: 1,
        type: 1,
        license: 1,
        isValidated: false,
      }).fetch();
      createdDocumentIds.push(doc.id);

      const newIds = await trackNotifications(async () => {
        await supertest(sails.hooks.http.app)
          .put('/api/v1/documents/validate')
          .send({
            documents: [
              {
                id: doc.id,
                isValidated: 'false',
                validationComment: 'Needs revision',
              },
            ],
          })
          .set('Authorization', moderatorToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(204);
      });

      const authorNotification = await TNotification.findOne({
        id: newIds,
        notified: 1,
        document: doc.id,
        notificationType: REJECT_TYPE_ID,
      });
      should(authorNotification).not.be.undefined();
      should(authorNotification.notifier).equal(2);
    });

    it('should NOT create author notifications when moderator is the author', async () => {
      const doc = await TDocument.create({
        author: 2,
        type: 1,
        license: 1,
        isValidated: false,
      }).fetch();
      createdDocumentIds.push(doc.id);

      const newIds = await trackNotifications(async () => {
        await supertest(sails.hooks.http.app)
          .put('/api/v1/documents/validate')
          .send({
            documents: [{ id: doc.id, isValidated: 'true' }],
          })
          .set('Authorization', moderatorToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(204);
      });

      const selfNotification = newIds.length
        ? await TNotification.find({
            id: newIds,
            notified: 2,
            document: doc.id,
          })
        : [];
      should(selfNotification).have.length(0);
    });

    it('should create correct notification types for a mixed batch', async () => {
      const acceptedDoc = await TDocument.create({
        author: 1,
        type: 1,
        license: 1,
        isValidated: false,
      }).fetch();
      createdDocumentIds.push(acceptedDoc.id);

      const rejectedDoc = await TDocument.create({
        author: 1,
        type: 1,
        license: 1,
        isValidated: false,
      }).fetch();
      createdDocumentIds.push(rejectedDoc.id);

      const newIds = await trackNotifications(async () => {
        await supertest(sails.hooks.http.app)
          .put('/api/v1/documents/validate')
          .send({
            documents: [
              { id: acceptedDoc.id, isValidated: 'true' },
              {
                id: rejectedDoc.id,
                isValidated: 'false',
                validationComment: 'Incomplete data',
              },
            ],
          })
          .set('Authorization', moderatorToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(204);
      });

      const validateNotification = await TNotification.findOne({
        id: newIds,
        notified: 1,
        document: acceptedDoc.id,
        notificationType: VALIDATE_TYPE_ID,
      });
      should(validateNotification).not.be.undefined();
      should(validateNotification.notifier).equal(2);

      const rejectNotification = await TNotification.findOne({
        id: newIds,
        notified: 1,
        document: rejectedDoc.id,
        notificationType: REJECT_TYPE_ID,
      });
      should(rejectNotification).not.be.undefined();
      should(rejectNotification.notifier).equal(2);
    });
  });
});
