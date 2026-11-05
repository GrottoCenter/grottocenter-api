const should = require('should');
const botSitemap = require('../../../api/utils/botSitemap');

describe('botSitemap', () => {
  describe('shardKey', () => {
    it('puts 1 and 49999 in shard 0, 50000 in shard 1, the largest id in shard 42949', () => {
      should(botSitemap.shardKey('cave', 1)).equal(0);
      should(botSitemap.shardKey('cave', 49999)).equal(0);
      should(botSitemap.shardKey('cave', 50000)).equal(1);
      should(botSitemap.shardKey('organization', 2147483647)).equal(42949);
    });

    it('refuses a type without pages', () => {
      should(() => botSitemap.shardKey('entrance', 1)).throw(RangeError);
      should(() => botSitemap.shardKey('hub', 1)).throw(RangeError);
    });
  });

  describe('shardPath', () => {
    it('names a shard by the plural of its type and its range', () => {
      should(botSitemap.shardPath('cave', 0)).equal('sitemap-caves-0.xml.gz');
      should(botSitemap.shardPath('massif', 3)).equal(
        'sitemap-massifs-3.xml.gz'
      );
      should(botSitemap.shardPath('organization', 12)).equal(
        'sitemap-organizations-12.xml.gz'
      );
    });

    it('refuses an unknown type or a shard that is not a natural number', () => {
      should(() => botSitemap.shardPath('document', 0)).throw(RangeError);
      should(() => botSitemap.shardPath('cave', -1)).throw(RangeError);
      should(() => botSitemap.shardPath('cave', 1.5)).throw(RangeError);
    });
  });

  describe('XML', () => {
    it('writes a urlset of loc and lastmod only, escaped, lastmod left out when unknown', () => {
      should(
        botSitemap.urlsetXml([
          {
            loc: 'https://x.test/a?b=1&c=<2>',
            lastmod: '2026-01-01T00:00:00Z',
          },
          { loc: 'https://x.test/b', lastmod: null },
        ])
      ).equal(
        '<?xml version="1.0" encoding="UTF-8"?>\n' +
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
          '<url><loc>https://x.test/a?b=1&amp;c=&lt;2&gt;</loc><lastmod>2026-01-01T00:00:00Z</lastmod></url>\n' +
          '<url><loc>https://x.test/b</loc></url>\n' +
          '</urlset>\n'
      );
    });

    it('writes a sitemapindex', () => {
      should(
        botSitemap.sitemapIndexXml([
          {
            loc: 'https://x.test/sitemap-caves-0.xml.gz',
            lastmod: '2026-01-01',
          },
        ])
      ).equal(
        '<?xml version="1.0" encoding="UTF-8"?>\n' +
          '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
          '<sitemap><loc>https://x.test/sitemap-caves-0.xml.gz</loc><lastmod>2026-01-01</lastmod></sitemap>\n' +
          '</sitemapindex>\n'
      );
    });
  });

  describe('siteOrigin', () => {
    it('serves the sitemaps at the origin of the public base URL', () => {
      should(botSitemap.siteOrigin('https://grottocenter.org/ui')).equal(
        'https://grottocenter.org'
      );
      should(botSitemap.siteOrigin('http://localhost:3000/ui/')).equal(
        'http://localhost:3000'
      );
    });
  });
});
