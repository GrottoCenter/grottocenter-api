const should = require('should');
const fc = require('fast-check');
const RelevanceService = require('../../../api/services/RelevanceService');

describe('RelevanceService', () => {
  describe('computeNextRelevance()', () => {
    /**
     * Property 1: Creation assigns next relevance
     *
     * For any parent scope containing N non-deleted entities with relevance
     * values, computeNextRelevance should return max(existing) + 1.
     * When N is 0, it should return 1.
     *
     * **Validates: Requirements 1.1, 1.2, 1.3**
     */
    it('should assign max(existing relevance) + 1, or 1 for empty scope', async function pbt1() {
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

    it('should only consider non-deleted entities (ignores deleted)', async function pbt2() {
      this.timeout(120000);
      const entranceId = 8999;
      const createdIds = [];

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
            createdIds.length = 0;

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

    /**
     * Unit test: returns 1 for empty scope
     * **Validates: Requirements 1.2**
     */
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
     * Unit test: ignores deleted entities when computing next relevance
     * **Validates: Requirements 1.3**
     */
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
     * Property 2: Move swaps exactly two entities and preserves all others
     *
     * For any parent scope containing at least 2 non-deleted entities, and any
     * valid move direction (+1 or -1) applied to a non-boundary entity, the move
     * operation should exchange the relevance values of exactly the target entity
     * and its adjacent neighbor, while all other entities in the scope retain
     * their original relevance values.
     *
     * **Validates: Requirements 2.1, 5.1**
     */
    it('should swap exactly two entities and preserve all others', async function pbt3() {
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

    /**
     * Unit test: throws 404 for non-existent entity
     * **Validates: Requirements 2.2**
     */
    it('should throw 404 for a non-existent entity', async () => {
      try {
        await RelevanceService.moveRelevance('comment', 999999, 1);
        should.fail('Expected an error to be thrown');
      } catch (err) {
        should(err.status).equal(404);
        should(err.message).equal('Comment of id 999999 not found.');
      }
    });

    /**
     * Unit test: throws 400 for a deleted entity
     * **Validates: Requirements 2.3**
     */
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

    /**
     * Unit test: throws 400 at boundary (single entity, no neighbor)
     * **Validates: Requirements 2.4**
     */
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

        // Try moving up — no neighbor above
        try {
          await RelevanceService.moveRelevance('comment', commentId, -1);
          should.fail('Expected an error to be thrown');
        } catch (err) {
          should(err.status).equal(400);
          should(err.message).equal(
            `Comment of id ${commentId} cannot be moved further in that direction.`
          );
        }

        // Try moving down — no neighbor below
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
     * Unit test: throws 400 for invalid direction values
     * **Validates: Requirements 2.4**
     */
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
