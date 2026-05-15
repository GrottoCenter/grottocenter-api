const Parser = require('rss-parser');
const underscoreDate = require('underscore.date');

const FR_RSS_FEED =
  'http://blog-fr.grottocenter.org/feeds/posts/default?alt=rss&max-results=1';
const EN_RSS_FEED =
  'http://blog-en.grottocenter.org/feeds/posts/default?alt=rss&max-results=1';

const FEED_TIMEOUT_MS = 10000;

const CommonService = require('../../../services/CommonService');

module.exports = async (req, res) => {
  // TODO error when language is neither FR nor EN
  const rssFeed = req.params.language === 'FR' ? FR_RSS_FEED : EN_RSS_FEED;
  const parser = new Parser({ timeout: FEED_TIMEOUT_MS });

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
    sails.log.error(
      `RSS feed fetch failed for ${req.params.language}: ${err.message}`
    );

    const isUpstreamError =
      /timed\s+out/i.test(err.message) ||
      err.code === 'ETIMEDOUT' ||
      err.code === 'ECONNREFUSED' ||
      err.code === 'ENOTFOUND' ||
      err.code === 'ECONNRESET';

    if (isUpstreamError) {
      return res.status(502).json({
        message: 'The upstream RSS feed is currently unavailable.',
      });
    }

    return res.serverError({
      message: 'An error occurred when getting the RSS feed.',
    });
  }
};
