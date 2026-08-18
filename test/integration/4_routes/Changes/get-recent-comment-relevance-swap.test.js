/**
 * Regression test for issue #1772:
 * "Reordering a newly created comment corrupts the recent changes feed"
 *
 * Root cause (fixed):
 *   The change_comment() DB trigger classified any UPDATE on an unreviewed
 *   comment (id_reviewer IS NULL) as type_change='create', attributing it to
 *   the row's original author.  This meant a relevance swap — which is a pure
 *   UPDATE that never sets id_reviewer — incorrectly logged the displaced old
 *   comment as newly created by its original author.
 *
 *   Fix: use TG_OP='INSERT' to guard the 'create' branch in all change_*()
 *   trigger functions, matching the already-correct change_guideline() pattern.
 *   An UPDATE falls through to the 'update' branch regardless of id_reviewer.
 *
 * Scenario (entrance 999, two pre-existing fixture comments by moderator):
 *   1. user1 creates a new comment  → appended at bottom (highest relevance)
 *   2. user1 moves it up twice      → swaps past both fixture comments 6 and 5
 *   3. user1 edits the new comment  → sets id_reviewer
 *   4. GET /api/v1/changes/recent   → inspect the groups for entrance 999
 *
 * Expected (correct) behaviour after fix:
 *   - user1 appears once with subAction='create'
 *   - moderator does not appear (they took no action)
 */
const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Changes - GET /api/v1/changes/recent', () => {
  describe('Issue #1772 — relevance swap must not corrupt recent changes', () => {
    let userToken;
    // Captured from the create response — all subsequent steps reference this.
    let newCommentId;

    before(async () => {
      userToken = await AuthTokenService.getRawBearerUserToken();
    });

    // ── Step 1: create a new comment as user1 ────────────────────────────────
    it('should create a new comment on entrance 999 (user1)', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/comments')
        .send({
          entrance: 999,
          title: 'New comment by user1',
          body: 'Will be moved up.',
          language: 'eng',
        })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          try {
            should(res.body).have.property('id');
            // New comment lands at the bottom: its relevance must be greater
            // than both fixture comments (rel 1 and 2).
            should(res.body.relevance).be.greaterThan(2);
            newCommentId = res.body.id;
            return done();
          } catch (testErr) {
            return done(testErr);
          }
        });
    });

    // ── Step 2a: move up — swaps new comment with next lower neighbor ─────────
    it('should move the new comment up once (swap with immediate lower neighbor)', (done) => {
      supertest(sails.hooks.http.app)
        .patch(`/api/v1/comments/${newCommentId}/move-relevance`)
        .send({ direction: -1 })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          try {
            should(res.body).have.property('moved');
            should(res.body.moved.id).equal(newCommentId);
            // Moved comment took the neighbor's relevance (lower value).
            should(res.body).have.property('swapped');
            should(res.body.swapped.relevance).be.greaterThan(
              res.body.moved.relevance
            );
            // The trigger's skip-log guard (app.relevance_swap_skip_log) now
            // prevents the displaced comment from generating a spurious 'create'
            // event for its original author.
            return done();
          } catch (testErr) {
            return done(testErr);
          }
        });
    });

    // ── Step 2b: move up again — swaps with fixture comment at relevance 1 ───
    it('should move the new comment up again past one of the fixture comments', (done) => {
      supertest(sails.hooks.http.app)
        .patch(`/api/v1/comments/${newCommentId}/move-relevance`)
        .send({ direction: -1 })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          try {
            should(res.body).have.property('moved');
            should(res.body.moved.id).equal(newCommentId);
            should(res.body).have.property('swapped');
            should(res.body.swapped.relevance).be.greaterThan(
              res.body.moved.relevance
            );
            // The skip-log guard prevents this second displaced comment from
            // generating a spurious event as well.
            return done();
          } catch (testErr) {
            return done(testErr);
          }
        });
    });

    // ── Step 3: edit the new comment within the 6h grouping window ────────────
    it('should edit the new comment (sets id_reviewer, obscures original create event)', (done) => {
      supertest(sails.hooks.http.app)
        .patch(`/api/v1/comments/${newCommentId}`)
        .send({
          title: 'New comment by user1 (edited)',
          body: 'Edited body.',
          language: 'eng',
        })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          try {
            should(res.body.title).equal('New comment by user1 (edited)');
            should(res.body.reviewer).have.property('id');
            return done();
          } catch (testErr) {
            return done(testErr);
          }
        });
    });

    // ── Step 4: assert recent-changes output ──────────────────────────────────
    it('should reflect the correct actors and actions in the recent-changes feed for entrance 999', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/changes/recent')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          try {
            const { changes } = res.body;
            should(changes).be.an.Array();

            const entrance999Groups = changes.filter(
              (c) => c.mainEntityId === 999
            );

            // ── user1's contribution ───────────────────────────────────────
            const user1Groups = entrance999Groups.filter(
              (c) => c.author === 'User1'
            );

            should(user1Groups).have.length(
              1,
              'user1 must appear exactly once in recent changes for entrance 999'
            );

            // user1 created the new comment and later edited it within the 6h
            // window. The trigger now uses TG_OP='INSERT' for 'create', so the
            // edit (an UPDATE) is classified as 'update'. groupChanges() gives
            // 'create' priority over 'update' within the same group, so the
            // contribution correctly surfaces as 'create'.
            should(user1Groups[0].subAction).equal(
              'create',
              'user1 new comment must appear as "create" in recent changes'
            );

            // ── displaced old fixture comments must NOT appear ─────────────
            const moderatorGroups = entrance999Groups.filter(
              (c) => c.author === 'Moderator1'
            );

            // Relevance swaps are UPDATEs. With TG_OP='INSERT' guarding the
            // 'create' branch, a swap on an unreviewed comment now falls into
            // the 'update' branch. groupChanges() groups those updates under
            // the actor who triggered the move (user1), not the displaced
            // comment's original author (moderator). Moderator took no action.
            should(moderatorGroups.length).equal(
              0,
              'moderator must not appear in recent changes — they took no action'
            );

            return done();
          } catch (testErr) {
            return done(testErr);
          }
        });
    });
  });
});
