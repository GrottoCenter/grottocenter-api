const should = require('should');
const normalizeBoolFilter = require('../../../api/utils/normalizeBoolFilter');

describe('normalizeBoolFilter', () => {
  it('keeps a JSON boolean', () => {
    should(normalizeBoolFilter({ hasFiles: true }, 'hasFiles')).eql({
      filter: { hasFiles: true },
    });
    should(normalizeBoolFilter({ hasFiles: false }, 'hasFiles')).eql({
      filter: { hasFiles: false },
    });
  });

  it('turns the string encodings into booleans', () => {
    should(normalizeBoolFilter({ hasFiles: 'true' }, 'hasFiles')).eql({
      filter: { hasFiles: true },
    });
    should(normalizeBoolFilter({ hasFiles: '1' }, 'hasFiles')).eql({
      filter: { hasFiles: true },
    });
    should(normalizeBoolFilter({ hasFiles: 'false' }, 'hasFiles')).eql({
      filter: { hasFiles: false },
    });
    should(normalizeBoolFilter({ hasFiles: '0' }, 'hasFiles')).eql({
      filter: { hasFiles: false },
    });
  });

  it('keeps the other filter entries', () => {
    should(
      normalizeBoolFilter({ hasFiles: 'true', type: 'Article' }, 'hasFiles')
    ).eql({ filter: { hasFiles: true, type: 'Article' } });
  });

  it('removes an empty value, which does not filter', () => {
    should(normalizeBoolFilter({ hasFiles: '', type: 'x' }, 'hasFiles')).eql({
      filter: { type: 'x' },
    });
    should(normalizeBoolFilter({ hasFiles: null }, 'hasFiles')).eql({
      filter: {},
    });
  });

  it('returns the filter untouched when the key is absent', () => {
    const filter = { type: 'Article' };
    should(normalizeBoolFilter(filter, 'hasFiles').filter).equal(filter);
    should(normalizeBoolFilter(undefined, 'hasFiles')).eql({
      filter: undefined,
    });
  });

  it('does not change the request filter', () => {
    const filter = { hasFiles: 'true' };
    normalizeBoolFilter(filter, 'hasFiles');
    should(filter).eql({ hasFiles: 'true' });
  });

  it('rejects a value that is not a boolean encoding', () => {
    ['yes', 'TRUE', 2, 0, ['true'], {}].forEach((value) => {
      should(normalizeBoolFilter({ hasFiles: value }, 'hasFiles')).eql({
        error: { field: 'filter.hasFiles', value },
      });
    });
  });
});
