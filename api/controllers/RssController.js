/**
 * RssController
 */
'use strict';
const feedRead = require('feed-read');
const _date = require('underscore.date');

const FR_RSS_FEED = 'http://blog-fr.grottocenter.org/feeds/posts/default?alt=rss&max-results=1';
const EN_RSS_FEED = 'http://blog-en.grottocenter.org/feeds/posts/default?alt=rss&max-results=1';

module.exports = {
  getFeed: function(req, res) {
    // TODO error when language is neither FR nor EN
    let rssFeed = req.params.language === 'FR' ? FR_RSS_FEED : EN_RSS_FEED;
    feedRead(rssFeed, function(err, articles) {
      if (err) {
        sails.log.error(err);
        return res.serverError('RssController.getFeed error : ' + err);
      }

      let result = {};
      result.title = CommonService.convertHtmlToText(articles[0].title, 50);
      result.text = CommonService.convertHtmlToText(articles[0].content, 255);
      result.link = articles[0].link;
      result.day = articles[0].published.getDate();
      result.month = _date.monthsShort[articles[0].published.getMonth()];
      return res.json(result);
    });
  }
};
