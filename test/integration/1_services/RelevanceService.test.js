const should = require('should');
const fc = require('fast-check');
const RelevanceService = require('../../../api/services/RelevanceService');

describe('RelevanceService', () => {
  describe('computeNextRelevance()', () => {
    /**
     * Next relevance equals max(existing) + 1, or 1 for empty scope.
     * Encodes: new entities always land after the current highest relevance.
     * Covers: scopes with 0 to N non-deleted entities with arbitrary relevance values.
     */
    it('should assign max(existing relevance) + 1, or 1 for empty scope', async function nextRelevanceIsMaxPlusOne() {
      this.timeout(120000);
      // Use a high entrance ID to avoid fixture conflicts
      const BASE_ENTRANCE_ID = 9000;
      let scenarioIndex = 0;

      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.integer({ min: 1, max: 10000 }), {
            minLength: 0,
            maxLength: 10,
          }),
          async (relevanceValues) => {
            scenarioIndex += 1;
            const entranceId = BASE_ENTRANCE_ID + scenarioIndex;
            const createdIds = [];

            try {
              // Set up: create TComment entities with the generated relevance values
              // eslint-disable-next-line no-await-in-loop
              const created = await Promise.all(
                relevanceValues.map((rel) =>
                  TComment.create({
                    author: 1,
                    dateInscription: new Date().toISOString(),
                    relevance: rel,
                    title: `PBT comment ${scenarioIndex}`,
                    body: `Property test body`,
                    entrance: entranceId,
                    language: 'fra',
                    isDeleted: false,
                  }).fetch()
                )
              );
              created.forEach((c) => createdIds.push(c.id));

              // Act: compute next relevance
              const result = await RelevanceService.computeNextRelevance(
                'comment',
                { entrance: entranceId }
              );

              // Assert
              if (relevanceValues.length === 0) {
                should(result).equal(1);
              } else {
                const maxRelevance = Math.max(...relevanceValues);
                should(result).equal(maxRelevance + 1);
              }
            } finally {
              // Cleanup: destroy all created comments
              if (createdIds.length > 0) {
                await TComment.destroy({ id: createdIds });
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Deleted entities are invisible to relevance computation.
     * Encodes: only non-deleted entities contribute to the max relevance.
     * Covers: scopes with a mix of active and deleted entities.
     */
    it('should only consider non-deleted entities (ignores deleted)', async function deletedEntitiesAreInvisible() {
      this.timeout(120000);
      const BASE_ENTRANCE_ID = 8900;
      let scenarioIndex = 0;

      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.integer({ min: 1, max: 10000 }), {
            minLength: 1,
            maxLength: 5,
          }),
          fc.array(fc.integer({ min: 1, max: 10000 }), {
            minLength: 1,
            maxLength: 5,
          }),
          async (activeRelevances, deletedRelevances) => {
            scenarioIndex += 1;
            const entranceId = BASE_ENTRANCE_ID + scenarioIndex;
            const createdIds = [];

            try {
              // Create active (non-deleted) comments
              const activeCreated = await Promise.all(
                activeRelevances.map((rel) =>
                  TComment.create({
                    author: 1,
                    dateInscription: new Date().toISOString(),
                    relevance: rel,
                    title: 'PBT active',
                    body: 'Active comment',
                    entrance: entranceId,
                    language: 'fra',
                    isDeleted: false,
                  }).fetch()
                )
              );
              activeCreated.forEach((c) => createdIds.push(c.id));

              // Create deleted comments (should be ignored)
              const deletedCreated = await Promise.all(
                deletedRelevances.map((rel) =>
                  TComment.create({
                    author: 1,
                    dateInscription: new Date().toISOString(),
                    relevance: rel,
                    title: 'PBT deleted',
                    body: 'Deleted comment',
                    entrance: entranceId,
                    language: 'fra',
                    isDeleted: true,
                  }).fetch()
                )
              );
              deletedCreated.forEach((c) => createdIds.push(c.id));

              // Act
              const result = await RelevanceService.computeNextRelevance(
                'comment',
                { entrance: entranceId }
              );

              // Assert: should only consider active relevances
              const maxActive = Math.max(...activeRelevances);
              should(result).equal(maxActive + 1);
            } finally {
              if (createdIds.length > 0) {
                await TComment.destroy({ id: createdIds });
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /** Returns 1 when no entities exist â€” the base case for relevance. */
    it('should return 1 when no entities exist in the scope', async () => {
      const entranceId = 6001;
      // Ensure no comments exist for this entrance
      await TComment.destroy({ entrance: entranceId });

      const result = await RelevanceService.computeNextRelevance('comment', {
        entrance: entranceId,
      });

      should(result).equal(1);
    });

    /**
     * Entities with null relevance must not pollute the max computation.
     * Root bug: PostgreSQL sorts NULLs first with DESC, so without filtering,
     * results[0].relevance = null â†’ null + 1 = 1 in JS â†’ collision with
     * existing items already at relevance=1.
     * Uses native SQL to bypass Waterline's allowNull:false validation.
     */
    it('should return 1 when all existing entities have null relevance', async () => {
      const entranceId = 6005;

      try {
        await sails.sendNativeQuery(
          `INSERT INTO t_comment (id_author, date_inscription, relevance, title, body, id_entrance, id_language, is_deleted)
           VALUES (1, NOW(), NULL, 'Null relevance test', 'Should be ignored', $1, 'fra', false),
                  (1, NOW(), NULL, 'Null relevance test', 'Should be ignored', $1, 'fra', false)`,
          [entranceId]
        );

        const result = await RelevanceService.computeNextRelevance('comment', {
          entrance: entranceId,
        });

        should(result).equal(1);
      } finally {
        await sails.sendNativeQuery(
          'DELETE FROM t_comment WHERE id_entrance = $1',
          [entranceId]
        );
      }
    });

    /**
     * When the scope mixes null and non-null relevance, only non-null values
     * count. The next relevance must be max(non-null) + 1, not 1.
     * Uses native SQL to bypass Waterline's allowNull:false validation.
     */
    it('should ignore null-relevance entities and use max of non-null values', async () => {
      const entranceId = 6006;

      try {
        // Insert non-null entries via ORM
        await Promise.all(
          [3, 7].map((rel) =>
            TComment.create({
              author: 1,
              dateInscription: new Date().toISOString(),
              relevance: rel,
              title: 'Mixed null relevance test',
              body: 'Should compute max of non-null',
              entrance: entranceId,
              language: 'fra',
              isDeleted: false,
            })
          )
        );
        // Insert null entries via native SQL
        await sails.sendNativeQuery(
          `INSERT INTO t_comment (id_author, date_inscription, relevance, title, body, id_entrance, id_language, is_deleted)
           VALUES (1, NOW(), NULL, 'Mixed null relevance test', 'Null entry', $1, 'fra', false)`,
          [entranceId]
        );

        const result = await RelevanceService.computeNextRelevance('comment', {
          entrance: entranceId,
        });

        should(result).equal(8); // max(3, 7) + 1
      } finally {
        await sails.sendNativeQuery(
          'DELETE FROM t_comment WHERE id_entrance = $1',
          [entranceId]
        );
      }
    });

    /** Returns 1 when only deleted entities exist â€” they are invisible. */
    it('should return 1 when only deleted entities exist in the scope', async () => {
      const entranceId = 6002;
      const createdIds = [];

      try {
        // Create only deleted comments
        const created = await Promise.all(
          [3, 7, 10].map((rel) =>
            TComment.create({
              author: 1,
              dateInscription: new Date().toISOString(),
              relevance: rel,
              title: 'Deleted only test',
              body: 'Should be ignored',
              entrance: entranceId,
              language: 'fra',
              isDeleted: true,
            }).fetch()
          )
        );
        created.forEach((c) => createdIds.push(c.id));

        const result = await RelevanceService.computeNextRelevance('comment', {
          entrance: entranceId,
        });

        should(result).equal(1);
      } finally {
        if (createdIds.length > 0) {
          await TComment.destroy({ id: createdIds });
        }
      }
    });
  });

  describe('moveRelevance()', () => {
    /**
     * Move swaps exactly the target and its neighbor; all others are unchanged.
     * Encodes: move is a pairwise swap, not a shift or reorder of the full list.
     * Covers: scopes with 2â€“10 entities, both move directions, non-boundary targets.
     */
    it('should swap exactly two entities and preserve all others', async function moveSwapsExactlyTwoEntities() {
      this.timeout(120000);
      const BASE_ENTRANCE_ID = 7000;
      let scenarioIndex = 0;

      await fc.assert(
        fc.asyncProperty(
          fc.uniqueArray(fc.integer({ min: 1, max: 10000 }), {
            minLength: 2,
            maxLength: 10,
          }),
          fc.constantFrom(1, -1),
          async (relevanceValues, direction) => {
            scenarioIndex += 1;
            const entranceId = BASE_ENTRANCE_ID + scenarioIndex;
            const createdIds = [];

            try {
              // Create TComment entities with unique relevance values
              const created = await Promise.all(
                relevanceValues.map((rel) =>
                  TComment.create({
                    author: 1,
                    dateInscription: new Date().toISOString(),
                    relevance: rel,
                    title: `PBT move ${scenarioIndex}`,
                    body: 'Property test body',
                    entrance: entranceId,
                    language: 'fra',
                    isDeleted: false,
                  }).fetch()
                )
              );
              const entities = created.map((c, i) => ({
                id: c.id,
                relevance: relevanceValues[i],
              }));
              created.forEach((c) => createdIds.push(c.id));

              // Sort entities by relevance to determine ordering
              entities.sort((a, b) => a.relevance - b.relevance);

              // Pick a non-boundary target index for the chosen direction
              // direction 1 (down): cannot be last, so index in [0, len-2]
              // direction -1 (up): cannot be first, so index in [1, len-1]
              let targetIndex;
              if (direction === 1) {
                targetIndex = scenarioIndex % (entities.length - 1); // [0, len-2]
              } else {
                targetIndex = 1 + (scenarioIndex % (entities.length - 1)); // [1, len-1]
              }

              const target = entities[targetIndex];
              const neighborIndex =
                direction === 1 ? targetIndex + 1 : targetIndex - 1;
              const neighbor = entities[neighborIndex];

              // Record all relevance values before the move
              const beforeMap = {};
              for (const e of entities) {
                beforeMap[e.id] = e.relevance;
              }

              // Act: perform the move
              const result = await RelevanceService.moveRelevance(
                'comment',
                target.id,
                direction
              );

              // Fetch all entities after the move
              const afterEntities = await TComment.find({
                id: createdIds,
              });
              const afterMap = {};
              for (const e of afterEntities) {
                afterMap[e.id] = e.relevance;
              }

              // Assert: target now has neighbor's old relevance
              should(afterMap[target.id]).equal(
                beforeMap[neighbor.id],
                `Target ${target.id} should have neighbor's old relevance`
              );

              // Assert: neighbor now has target's old relevance
              should(afterMap[neighbor.id]).equal(
                beforeMap[target.id],
                `Neighbor ${neighbor.id} should have target's old relevance`
              );

              // Assert: all other entities retain their original relevance
              for (const e of entities) {
                if (e.id !== target.id && e.id !== neighbor.id) {
                  should(afterMap[e.id]).equal(
                    beforeMap[e.id],
                    `Entity ${e.id} should retain its original relevance`
                  );
                }
              }

              // Assert: result contains the moved and swapped entities
              should(result).have.property('moved');
              should(result).have.property('swapped');
              should(result.moved.id).equal(target.id);
              should(result.swapped.id).equal(neighbor.id);
            } finally {
              if (createdIds.length > 0) {
                await TComment.destroy({ id: createdIds });
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /** Throws 404 when the entity does not exist. */
    it('should throw 404 for a non-existent entity', async () => {
      try {
        await RelevanceService.moveRelevance('comment', 999999, 1);
        should.fail('Expected an error to be thrown');
      } catch (err) {
        should(err.status).equal(404);
        should(err.message).equal('Comment of id 999999 not found.');
      }
    });

    /** Throws 400 when the entity is deleted. */
    it('should throw 400 for a deleted entity', async () => {
      const entranceId = 6003;
      let commentId;

      try {
        const comment = await TComment.create({
          author: 1,
          dateInscription: new Date().toISOString(),
          relevance: 1,
          title: 'Deleted entity test',
          body: 'This comment is deleted',
          entrance: entranceId,
          language: 'fra',
          isDeleted: true,
        }).fetch();
        commentId = comment.id;

        try {
          await RelevanceService.moveRelevance('comment', commentId, 1);
          should.fail('Expected an error to be thrown');
        } catch (err) {
          should(err.status).equal(400);
          should(err.message).equal(`Comment of id ${commentId} is deleted.`);
        }
      } finally {
        if (commentId) {
          await TComment.destroy({ id: commentId });
        }
      }
    });

    /** Throws 400 when the entity is at the boundary with no neighbor. */
    it('should throw 400 when entity is at boundary', async () => {
      const entranceId = 6004;
      let commentId;

      try {
        const comment = await TComment.create({
          author: 1,
          dateInscription: new Date().toISOString(),
          relevance: 1,
          title: 'Boundary test',
          body: 'Only comment in scope',
          entrance: entranceId,
          language: 'fra',
          isDeleted: false,
        }).fetch();
        commentId = comment.id;

        // Try moving up â€” no neighbor above
        try {
          await RelevanceService.moveRelevance('comment', commentId, -1);
          should.fail('Expected an error to be thrown');
        } catch (err) {
          should(err.status).equal(400);
          should(err.message).equal(
            `Comment of id ${commentId} cannot be moved further in that direction.`
          );
        }

        // Try moving down â€” no neighbor below
        try {
          await RelevanceService.moveRelevance('comment', commentId, 1);
          should.fail('Expected an error to be thrown');
        } catch (err) {
          should(err.status).equal(400);
          should(err.message).equal(
            `Comment of id ${commentId} cannot be moved further in that direction.`
          );
        }
      } finally {
        if (commentId) {
          await TComment.destroy({ id: commentId });
        }
      }
    });

    /**
     * An unranked entity (relevance = null) cannot be swapped.
     * Instead it is assigned computeNextRelevance() and returned with swapped: null.
     * Uses native SQL to bypass Waterline's allowNull:false validation.
     */
    it('should assign relevance and return swapped: null for a null-relevance entity', async () => {
      const entranceId = 6007;
      const createdIds = [];

      try {
        // Seed two ranked comments so computeNextRelevance returns 3
        const ranked = await Promise.all(
          [1, 2].map((rel) =>
            TComment.create({
              author: 1,
              dateInscription: new Date().toISOString(),
              relevance: rel,
              title: 'Ranked comment',
              body: 'Has a relevance value',
              entrance: entranceId,
              language: 'fra',
              isDeleted: false,
            }).fetch()
          )
        );
        ranked.forEach((c) => createdIds.push(c.id));

        // Insert unranked comment via native SQL
        const { rows } = await sails.sendNativeQuery(
          `INSERT INTO t_comment (id_author, date_inscription, relevance, title, body, id_entrance, id_language, is_deleted)
           VALUES (1, NOW(), NULL, 'Unranked comment', 'No relevance yet', $1, 'fra', false)
           RETURNING id`,
          [entranceId]
        );
        const unrankedId = rows[0].id;
        createdIds.push(unrankedId);

        const result = await RelevanceService.moveRelevance(
          'comment',
          unrankedId,
          1
        );

        should(result.swapped).be.null();
        should(result.moved).have.property('id', unrankedId);
        should(result.moved.relevance).equal(3); // max(1,2) + 1
      } finally {
        if (createdIds.length > 0) {
          await TComment.destroy({ id: createdIds });
        }
      }
    });

    /**
     * A null-relevance neighbor must not be a swap candidate.
     * The move should skip null-relevance entities and swap with the
     * nearest ranked neighbor only.
     * Uses native SQL to bypass Waterline's allowNull:false validation.
     */
    it('should skip null-relevance neighbors and swap with the nearest ranked one', async () => {
      const entranceId = 6008;
      const createdIds = [];

      try {
        // Insert ranked comments via ORM
        const [c1, c2, c3] = await Promise.all(
          [1, 2, 3].map((rel) =>
            TComment.create({
              author: 1,
              dateInscription: new Date().toISOString(),
              relevance: rel,
              title: 'Neighbor null test',
              body: 'Testing null skip',
              entrance: entranceId,
              language: 'fra',
              isDeleted: false,
            }).fetch()
          )
        );
        createdIds.push(c1.id, c2.id, c3.id);

        // Insert a null-relevance neighbor via native SQL (should be skipped)
        const { rows } = await sails.sendNativeQuery(
          `INSERT INTO t_comment (id_author, date_inscription, relevance, title, body, id_entrance, id_language, is_deleted)
           VALUES (1, NOW(), NULL, 'Null neighbor', 'Must be skipped', $1, 'fra', false)
           RETURNING id`,
          [entranceId]
        );
        createdIds.push(rows[0].id);

        // Move c2 (relevance=2) up by direction=1: nearest ranked neighbor above is c3 (relevance=3)
        const result = await RelevanceService.moveRelevance(
          'comment',
          c2.id,
          1
        );

        should(result.moved.id).equal(c2.id);
        should(result.moved.relevance).equal(3);
        should(result.swapped.id).equal(c3.id);
        should(result.swapped.relevance).equal(2);

        // c1 is untouched
        const afterC1 = await TComment.findOne({ id: c1.id });
        should(afterC1.relevance).equal(1);
      } finally {
        if (createdIds.length > 0) {
          await TComment.destroy({ id: createdIds });
        }
      }
    });

    /** Throws 400 for invalid direction values (only 1 and -1 are valid). */
    it('should throw 400 for invalid direction values', async () => {
      const invalidDirections = [0, 2, -3];

      await Promise.all(
        invalidDirections.map(async (dir) => {
          try {
            await RelevanceService.moveRelevance('comment', 1, dir);
            should.fail(`Expected an error for direction ${dir}`);
          } catch (err) {
            should(err.status).equal(400);
            should(err.message).equal('Direction must be 1 or -1.');
          }
        })
      );
    });
  });
});
