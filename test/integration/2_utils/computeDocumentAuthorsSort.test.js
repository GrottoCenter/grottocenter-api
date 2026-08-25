const should = require('should');
const {
  EMPTY_AUTHORS_SORT_KEY,
  computeDocumentAuthorsSort,
} = require('../../../api/utils/computeDocumentAuthorsSort');

describe('computeDocumentAuthorsSort', () => {
  it('returns the alphabetical-first author across persons and organizations', () => {
    should(
      computeDocumentAuthorsSort(['Zola', 'Adam'], ['Meandre Club'])
    ).equal('adam');
    should(computeDocumentAuthorsSort(['Zola'], ['AAA Speleo Club'])).equal(
      'aaa speleo club'
    );
  });

  it('strips diacritics so accented names sort with their base letter', () => {
    should(computeDocumentAuthorsSort(['Émile'])).equal('emile');
    should(computeDocumentAuthorsSort(['Çelik'])).equal('celik');
  });

  it('lowercases and collapses whitespace', () => {
    should(computeDocumentAuthorsSort(['  Jean   Dupont '])).equal(
      'jean dupont'
    );
  });

  it('ignores null/undefined/blank names', () => {
    should(
      computeDocumentAuthorsSort([null, '   ', 'Bernard'], [undefined])
    ).equal('bernard');
  });

  it('returns the sentinel (sorting last) when there is no author', () => {
    should(computeDocumentAuthorsSort([], [])).equal(EMPTY_AUTHORS_SORT_KEY);
    should(computeDocumentAuthorsSort()).equal(EMPTY_AUTHORS_SORT_KEY);
    // The sentinel sorts after any normalized a-z name on ascending order.
    should(EMPTY_AUTHORS_SORT_KEY > 'zzzzz').be.true();
  });

  it('defaults each argument independently', () => {
    should(computeDocumentAuthorsSort(undefined, ['Org Only'])).equal(
      'org only'
    );
    should(computeDocumentAuthorsSort(['Person Only'])).equal('person only');
  });
});
