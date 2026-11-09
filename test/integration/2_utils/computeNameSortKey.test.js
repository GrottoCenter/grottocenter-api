const should = require('should');
const {
  NAMED_SORT_KEY_PREFIX,
  EMPTY_NAME_SORT_KEY,
  computeNameSortKey,
} = require('../../../api/utils/computeNameSortKey');

const named = (name) => NAMED_SORT_KEY_PREFIX + name;

// The normalization and ordering rules are covered through their first user,
// computeDocumentAuthorsSort (unit and property tests). These cover the
// generic entry point: a single list, several lists, nothing at all.
describe('computeNameSortKey', () => {
  it('returns the alphabetical-first normalized name of a single list', () => {
    should(computeNameSortKey(['Gouffre Berger', 'Aven Armand'])).equal(
      named('aven armand')
    );
    should(computeNameSortKey(['Éntrée Ouest'])).equal(named('entree ouest'));
  });

  it('pools several lists', () => {
    should(computeNameSortKey(['Zola'], ['Adam'], ['Meandre'])).equal(
      named('adam')
    );
  });

  it('skips missing lists and blank names', () => {
    should(computeNameSortKey(undefined, [null, ' ', 'Bernard'], null)).equal(
      named('bernard')
    );
  });

  it('returns the empty key, sorting last, when there is no name', () => {
    should(computeNameSortKey()).equal(EMPTY_NAME_SORT_KEY);
    should(computeNameSortKey([])).equal(EMPTY_NAME_SORT_KEY);
    should(computeNameSortKey([null, '  '])).equal(EMPTY_NAME_SORT_KEY);
    should(named('山田') < EMPTY_NAME_SORT_KEY).be.true();
  });
});
