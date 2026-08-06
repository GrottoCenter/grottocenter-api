const should = require('should');
const fc = require('fast-check');

describe('CSVImportQueueService - Property: affinity chunking co-location and completeness', () => {
  it('should place all rows with the same key in the same chunk and preserve total count', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.oneof(
              fc.constant(null),
              fc.string({ minLength: 1, maxLength: 5 })
            ),
            'dct:rights/cc:attributionName': fc.oneof(
              fc.constant(null),
              fc.string({ minLength: 1, maxLength: 5 })
            ),
          }),
          { minLength: 1, maxLength: 200 }
        ),
        fc.integer({ min: 1, max: 100 }),
        (rows, chunkSize) => {
          const chunks = CSVImportQueueService.affinityChunk(rows, chunkSize);

          // Property A: total row count preserved (no loss, no duplication)
          const totalRows = chunks.reduce(
            (sum, chunk) => sum + chunk.length,
            0
          );
          should(totalRows).equal(rows.length);

          // Property B: rows with same non-null key are in the same chunk
          const keyToChunkIndex = new Map();
          for (let ci = 0; ci < chunks.length; ci += 1) {
            for (const entry of chunks[ci]) {
              const { row } = entry;
              const id = row.id || null;
              if (id === null) {
                // null-id rows have no affinity constraint — skip
                continue; // eslint-disable-line no-continue
              }
              const name = row['dct:rights/cc:attributionName'] || null;
              const key = `${id}|||${name}`;
              if (keyToChunkIndex.has(key)) {
                should(keyToChunkIndex.get(key)).equal(
                  ci,
                  `Key "${key}" found in chunk ${ci} but was already in chunk ${keyToChunkIndex.get(key)}`
                );
              } else {
                keyToChunkIndex.set(key, ci);
              }
            }
          }

          // Property C: originalLine numbers are correct (index + 2)
          const allEntries = chunks.flat();
          const linesSeen = new Set();
          for (const entry of allEntries) {
            should(entry.originalLine).be.a.Number();
            should(entry.originalLine).be.aboveOrEqual(2);
            linesSeen.add(entry.originalLine);
          }
          // All lines should be unique
          should(linesSeen.size).equal(rows.length);
        }
      ),
      { numRuns: 100 }
    );
  }).timeout(30000);
});
