const should = require('should');
const fc = require('fast-check');

describe('dbSync utils - Property: JSONArrayStringify round-trips its rows', () => {
  let JSONArrayStringify;

  before(() => {
    // eslint-disable-next-line global-require
    ({ JSONArrayStringify } = require('../../../api/dbSync/utils'));
  });

  /**
   * Rows as an export would carry them: objects of JSON values, including
   * strings with newlines, quotes and non-ASCII characters, nested arrays and
   * nulls. The property rules out framing bugs: a missing or doubled
   * separator, a trailing comma, a dropped first or last row.
   */
  const rowArb = fc.dictionary(fc.string(), fc.jsonValue({ maxDepth: 3 }));

  it('parses back to the same rows, in the same order', async () => {
    await fc.assert(
      fc.asyncProperty(fc.array(rowArb, { maxLength: 20 }), async (rows) => {
        let output = '';
        for await (const chunk of JSONArrayStringify(rows)) output += chunk;
        // JSON itself turns -0 into 0: compare against the JSON form
        const expected = rows.map((r) => JSON.parse(JSON.stringify(r)));
        should(JSON.parse(output)).eql(expected);
      }),
      { numRuns: 100 }
    );
  });
});
