const Parser = require('rss-parser');
const underscoreDate = require('underscore.date');

const FR_RSS_FEED =
  'http://blog-fr.grottocenter.org/feeds/posts/default?alt=rss&max-results=1';
const EN_RSS_FEED =
  'http://blog-en.grottocenter.org/feeds/posts/default?alt=rss&max-results=1';

const CommonService = require('../../../services/CommonService');

module.exports = async (req, res) => {
  // TODO error when language is neither FR nor EN
  const rssFeed = req.params.language === 'FR' ? FR_RSS_FEED : EN_RSS_FEED;
  const parser = new Parser();

  try {
    const feed = await parser.parseURL(rssFeed);
    const article = feed.items[0];

    const result = {};
    result.title = CommonService.convertHtmlToText(article.title, 50);
    result.text = CommonService.convertHtmlToText(
      article.content || article.contentSnippet,
      255
    );
    result.link = article.link;
    result.day = new Date(article.pubDate).getDate();
    result.month =
      underscoreDate.monthsShort[new Date(article.pubDate).getMonth()];

    return res.json(result);
  } catch (err) {
    return res.serverError({
      error: err,
      message: 'An error occurred when getting the RSS feed',
    });
  }
};
