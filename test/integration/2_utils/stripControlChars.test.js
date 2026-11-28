const should = require('should');
const stripControlChars = require('../../../api/utils/stripControlChars');

describe('stripControlChars', () => {
  it('removes MARC delimiters and other control characters', () => {
    should(stripControlChars('a\x1fb\x1ec\x1dd\x00e\x7ff\uFFFEg\uFFFFh')).equal(
      'abcdefgh'
    );
  });

  it('keeps tab, line feed and carriage return', () => {
    should(stripControlChars('a\tb\nc\rd')).equal('a\tb\nc\rd');
  });

  it('cleans arrays and plain objects recursively', () => {
    should(
      stripControlChars({ a: ['x\x1fy', { b: 'z\x1e' }], n: 3, nil: null })
    ).eql({ a: ['xy', { b: 'z' }], n: 3, nil: null });
  });

  it('leaves dates untouched', () => {
    const d = new Date();
    should(stripControlChars(d)).equal(d);
  });
});
