const should = require('should');
const extractFirstImageUrl = require('../../../api/utils/extractFirstImageUrl');

const BLOGGER_POST = `<div class="separator" style="clear: both;">
  <a href="https://blogger.googleusercontent.com/img/b/abc/s477/P1010001.JPG" style="margin-left: 1em;">
    <img alt="" border="0" width="320" data-original-height="477"
      src="https://blogger.googleusercontent.com/img/b/abc/s320/P1010001.JPG"/>
  </a>
</div>
<p>Some text</p>
<img src="https://blogger.googleusercontent.com/img/b/def/s320/second.JPG"/>`;

describe('extractFirstImageUrl', () => {
  it('should return the src of the first image of a Blogger post', () => {
    should(extractFirstImageUrl(BLOGGER_POST)).equal(
      'https://blogger.googleusercontent.com/img/b/abc/s320/P1010001.JPG'
    );
  });

  it('should accept single quotes and upper-case tags', () => {
    should(extractFirstImageUrl("<IMG SRC='https://example.org/a.png'>")).equal(
      'https://example.org/a.png'
    );
  });

  it('should decode &amp; in the URL', () => {
    should(
      extractFirstImageUrl('<img src="https://example.org/a.png?w=1&amp;h=2">')
    ).equal('https://example.org/a.png?w=1&h=2');
  });

  it('should not mistake data-src for src', () => {
    should(
      extractFirstImageUrl(
        '<img data-src="https://example.org/lazy.png" src="https://example.org/a.png">'
      )
    ).equal('https://example.org/a.png');
  });

  [
    ['a post without image', '<p>No picture today</p>'],
    ['an empty string', ''],
    ['undefined', undefined],
    ['null', null],
    ['a non-string value', 42],
    ['an image without src', '<img alt="x">'],
    ['a data: URL', '<img src="data:image/png;base64,AAAA">'],
    ['a javascript: URL', '<img src="javascript:alert(1)">'],
    ['a relative URL', '<img src="/images/a.png">'],
  ].forEach(([label, input]) => {
    it(`should return null for ${label}`, () => {
      should(extractFirstImageUrl(input)).be.null();
    });
  });
});
