const should = require('should');
const fs = require('fs');
const CommonService = require('../../../api/services/CommonService');

const html = fs
  .readFileSync(require.resolve('./FAKE_HTML_RSS_FEED.html'))
  .toString();

describe('CommonService', () => {
  describe('convertHtmlToText()', () => {
    it('should escape html tags and truncate the html', () => {
      const truncateLength = 100;
      const res = CommonService.convertHtmlToText(html, truncateLength);
      should(
        res.includes('<div>') || res.includes('<h4>') || res.includes('<p>')
      ).be.false();
      // 5 is arbitrary here: the truncating method cut before or after a word which changes the string length
      should(res.length).greaterThanOrEqual(truncateLength - 5);
      should(res.length).belowOrEqual(truncateLength + 5);
    });
  });
});
