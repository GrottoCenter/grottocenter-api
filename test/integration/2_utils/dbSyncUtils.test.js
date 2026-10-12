const should = require('should');

describe('dbSync utils', () => {
  let syncUtils;

  before(() => {
    // eslint-disable-next-line global-require
    syncUtils = require('../../../api/dbSync/utils');
  });

  const collect = async (generator) => {
    const pages = [];
    for await (const page of generator) pages.push(page);
    return pages;
  };

  describe('paggingQuery()', () => {
    const query = `
      SELECT e.id FROM t_entrance e
      WHERE e.id ${'#ID_FILTER#'}
      ORDER BY e.id ASC
      ${'#PAGGING#'}
    `;

    it('uses the placeholders exported by the module', () => {
      should(syncUtils.ID_FILTER_PLACEHOLDER).equal('#ID_FILTER#');
      should(syncUtils.PAGGING_PLACEHOLDER).equal('#PAGGING#');
    });

    it('walks every row once, in id order, one page after the other', async () => {
      const ref = {};
      const pages = await collect(
        syncUtils.paggingQuery('entrances', query, ref, 2)
      );

      // 9 fixture entrances: 4 full pages of 2, then a last page of 1
      should(pages.map((p) => p.length)).eql([2, 2, 2, 2, 1]);
      should(pages.flat().map((r) => r.id)).eql([1, 2, 3, 4, 5, 6, 7, 8, 999]);
      should(ref.fetched).equal(9);
    });

    it('stops with an extra empty page when the last page is full', async () => {
      const pages = await collect(
        syncUtils.paggingQuery('entrances', query, {}, 3)
      );
      should(pages.map((p) => p.length)).eql([3, 3, 3, 0]);
    });

    it('yields a single empty page when nothing matches', async () => {
      const ref = {};
      const pages = await collect(
        syncUtils.paggingQuery(
          'none',
          query.replace('WHERE', 'WHERE false AND'),
          ref
        )
      );
      should(pages).eql([[]]);
      should(ref.fetched).equal(0);
    });
  });

  describe('JSONArrayStringify()', () => {
    it('writes an empty JSON array when there are no rows', async () => {
      const chunks = await collect(syncUtils.JSONArrayStringify([]));
      should(JSON.parse(chunks.join(''))).eql([]);
    });

    it('writes one row per line', async () => {
      const chunks = await collect(
        syncUtils.JSONArrayStringify([{ id: 1 }, { id: 2 }])
      );
      should(chunks.join('')).equal('[\n{"id":1},\n{"id":2}\n]');
    });
  });
});
