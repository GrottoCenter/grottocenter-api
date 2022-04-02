const feedRead = require('feed-read');
const underscoreDate = require('underscore.date');

const FR_RSS_FEED =
  'http://blog-fr.grottocenter.org/feeds/posts/default?alt=rss&max-results=1';
const EN_RSS_FEED =
  'http://blog-en.grottocenter.org/feeds/posts/default?alt=rss&max-results=1';

const CommonService = require('../../../services/CommonService');

module.exports = (req, res) => {
  // TODO error when language is neither FR nor EN
  const rssFeed = req.params.language === 'FR' ? FR_RSS_FEED : EN_RSS_FEED;
  feedRead(rssFeed, (err, articles) => {
    if (err) {
      sails.log.error(err);
      return res.serverError(`RssController.getFeed error : ${err}`);
    }

    const result = {};
    result.title = CommonService.convertHtmlToText(articles[0].title, 50);
    result.text = CommonService.convertHtmlToText(articles[0].content, 255);
    result.link = articles[0].link;
    result.day = articles[0].published.getDate();
    result.month = underscoreDate.monthsShort[articles[0].published.getMonth()];

    return res.json(result);
  });
};
