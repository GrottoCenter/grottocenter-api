const should = require('should');
const {
  AUTHORED_SORT_KEY_PREFIX,
  EMPTY_AUTHORS_SORT_KEY,
  computeDocumentAuthorsSort,
} = require('../../../api/utils/computeDocumentAuthorsSort');

/** Key an authored document is expected to get for `name`. */
const authored = (name) => AUTHORED_SORT_KEY_PREFIX + name;

describe('computeDocumentAuthorsSort', () => {
  it('returns the alphabetical-first author across persons and organizations', () => {
    should(
      computeDocumentAuthorsSort(['Zola', 'Adam'], ['Meandre Club'])
    ).equal(authored('adam'));
    should(computeDocumentAuthorsSort(['Zola'], ['AAA Speleo Club'])).equal(
      authored('aaa speleo club')
    );
  });

  it('strips diacritics so accented names sort with their base letter', () => {
    should(computeDocumentAuthorsSort(['Émile'])).equal(authored('emile'));
    should(computeDocumentAuthorsSort(['Çelik'])).equal(authored('celik'));
  });

  it('lowercases and collapses whitespace', () => {
    should(computeDocumentAuthorsSort(['  Jean   Dupont '])).equal(
      authored('jean dupont')
    );
  });

  it('ignores null/undefined/blank names', () => {
    should(
      computeDocumentAuthorsSort([null, '   ', 'Bernard'], [undefined])
    ).equal(authored('bernard'));
  });

  it('returns the authorless key (sorting last) when there is no author', () => {
    should(computeDocumentAuthorsSort([], [])).equal(EMPTY_AUTHORS_SORT_KEY);
    should(computeDocumentAuthorsSort()).equal(EMPTY_AUTHORS_SORT_KEY);
  });

  it('defaults each argument independently', () => {
    should(computeDocumentAuthorsSort(undefined, ['Org Only'])).equal(
      authored('org only')
    );
    should(computeDocumentAuthorsSort(['Person Only'])).equal(
      authored('person only')
    );
  });

  describe('ordering against the authorless key', () => {
    // Normalization keeps non-ASCII letters, so the authorless key has to sort
    // after names in every script we can index — not just after a-z. Each of
    // these previously compared *above* the old '~' sentinel, putting
    // authorless documents first on ascending sort.
    const nonLatinNames = [
      ['Cyrillic', 'Ярославль'],
      ['Greek', 'Ωμέγα'],
      ['CJK', '山田太郎'],
      ['Hangul', '홍길동'],
      ['Arabic', 'محمد'],
      ['Hebrew', 'משה'],
      ['Thai', 'สมชาย'],
      ['retained Latin supplement', 'Þorvaldur'],
      ['astral-plane CJK extension B', '𠀋田'],
      ['high private use', '\u{10FFFD}'],
    ];

    for (const [label, name] of nonLatinNames) {
      it(`sorts a ${label} author before an authorless document`, () => {
        const key = computeDocumentAuthorsSort([name]);
        should(key).not.equal(EMPTY_AUTHORS_SORT_KEY);
        should(key < EMPTY_AUTHORS_SORT_KEY).be.true();
        // Also hold under UTF-8 byte order, which is what Typesense compares.
        should(
          Buffer.compare(Buffer.from(key), Buffer.from(EMPTY_AUTHORS_SORT_KEY))
        ).equal(-1);
      });
    }

    it('keeps a mixed-script result set in ascending order with authorless last', () => {
      const keys = [
        computeDocumentAuthorsSort([], []), // authorless
        computeDocumentAuthorsSort(['山田太郎']),
        computeDocumentAuthorsSort(['Adam']),
        computeDocumentAuthorsSort(['Ярославль']),
        computeDocumentAuthorsSort(['zola']),
      ];
      const sorted = [...keys].sort();
      should(sorted[sorted.length - 1]).equal(EMPTY_AUTHORS_SORT_KEY);
      should(sorted[0]).equal(authored('adam'));
    });
  });

  it('picks the code-point-smallest name, matching UTF-8 byte order', () => {
    // U+FFFD is a lower code point than '𠀋' (U+2000B) and sorts below it in
    // UTF-8 byte order, but '𠀋' is stored as the surrogate pair 0xD840 0xDC0B,
    // so a naive JS sort ranks '𠀋' first. The key must agree with the UTF-8
    // byte order Typesense uses, not with UTF-16 code-unit order.
    const bmp = '�ab';
    const astral = '\u{2000B}ab';
    should([bmp, astral].sort()[0]).equal(astral); // naive JS order disagrees
    should(
      Buffer.compare(Buffer.from(bmp, 'utf8'), Buffer.from(astral, 'utf8'))
    ).equal(-1); // UTF-8 byte order

    should(computeDocumentAuthorsSort([bmp, astral])).equal(authored(bmp));
    should(computeDocumentAuthorsSort([astral, bmp])).equal(authored(bmp));
  });
});
