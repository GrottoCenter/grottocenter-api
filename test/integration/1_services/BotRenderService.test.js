const fs = require('fs');
const should = require('should');
const sinon = require('sinon');
const { HtmlValidate } = require('html-validate/node');

// What loadCountryNames() reads from t_country: native_name
const COUNTRIES = new Map([['FR', 'France']]);

const BASE_URL = 'https://example.test/ui';
// What loadLanguageTags() reads from t_language
const TAGS = new Map([
  ['fra', 'fr'],
  ['eng', 'en'],
]);

describe('BotRenderService', () => {
  let BotRenderService;
  let validator;

  before(() => {
    // Sails re-requires api/ when it lifts: require the service here
    // eslint-disable-next-line global-require
    BotRenderService = require('../../../api/services/bot/BotRenderService');
    validator = new HtmlValidate({ extends: ['html-validate:recommended'] });
  });

  const render = (row, options = {}) =>
    BotRenderService.render(row, {
      languageTags: TAGS,
      countryNames: COUNTRIES,
      hubLinks: BotRenderService.NO_HUB_LINKS,
      ...options,
    });

  const description = (extra = {}) => ({
    title: 'Access',
    body: 'First line\nSecond line',
    language: 'fra',
    ...extra,
  });

  const rows = () => [
    {
      entity_type: 'cave',
      entity_id: 12,
      language: 'fra',
      lastmod: new Date('2026-01-01T00:00:00Z'),
      page: {
        id: 12,
        name: 'Gouffre <Test> & Cie',
        language: 'fra',
        depth: 250,
        length: null,
        temperature: 7,
        isDiving: false,
        lastmod: '2026-01-01T00:00:00Z',
        descriptions: [description(), description({ title: null })],
        massifs: [{ id: 3, name: 'Vercors' }],
        entrances: [
          {
            id: 1,
            name: null,
            city: 'Lans',
            county: 'Isère',
            region: 'Auvergne-Rhône-Alpes',
            country: 'FR',
            discoveryYear: 1950,
            dangerCo2: true,
            hasBat: false,
            descriptions: [description({ language: 'eng' })],
          },
        ],
      },
    },
    {
      entity_type: 'cave',
      entity_id: 13,
      language: 'fra',
      lastmod: new Date(),
      page: { id: 13, name: 'Bare cave' },
    },
    {
      entity_type: 'massif',
      entity_id: 3,
      language: 'fra',
      lastmod: new Date(),
      page: {
        id: 3,
        name: 'Vercors',
        language: 'fra',
        descriptions: [description()],
        caves: [
          { id: 12, name: 'Gouffre Test', depth: 250, length: null },
          { id: 14, name: 'Other', depth: null, length: 800 },
        ],
      },
    },
    {
      entity_type: 'organization',
      entity_id: 8,
      language: 'fra',
      lastmod: new Date(),
      page: {
        id: 8,
        name: 'Club "Spéléo"',
        language: 'fra',
        city: 'Lyon',
        county: null,
        region: 'Rhône',
        country: 'FR',
        url: 'https://example.org/club?a=1&b=2',
        yearBirth: 1950,
      },
    },
    {
      entity_type: 'organization',
      entity_id: 9,
      language: 'eng',
      lastmod: new Date(),
      page: { id: 9, name: 'No site', url: null },
    },
  ];

  describe('every page', () => {
    it('is valid HTML, with the licence footer and the generator marker', async () => {
      const pages = [
        ...rows().map((row) => render(row, { baseUrl: BASE_URL })),
        BotRenderService.renderNotFound({ baseUrl: BASE_URL }),
      ];
      should(pages.length).equal(6);

      for (const html of pages) {
        // eslint-disable-next-line no-await-in-loop
        const report = await validator.validateString(html);
        should(
          report.results.flatMap((r) =>
            r.messages.map((m) => `${m.ruleId}: ${m.message}`)
          )
        ).deepEqual([]);
        should(html).startWith('<!DOCTYPE html>');
        should(html).containEql(
          '<meta name="generator" content="gc-static-pages">'
        );
        should(html).containEql('viewport');
        should(html).containEql('CC-BY-SA');
        should(html).containEql('ODbL');
        should(html).containEql('rel="license"');
        should(html).containEql('<title>');
        // No external asset: no stylesheet link, no image, and no script
        // other than the JSON-LD block
        should(html).not.match(/<img|rel="stylesheet"/);
        should(html.match(/<script/g) || []).have.length(
          html.includes('application/ld+json') ? 1 : 0
        );
      }
    });

    it('does reject invalid HTML, so the check above means something', async () => {
      const report = await validator.validateString(
        '<html><body><p>no doctype <div></p></body></html>'
      );
      should(report.valid).be.false();
    });
  });

  describe('the page of a record', () => {
    it('declares the language of the record as a BCP 47 tag: the 2-letter code when there is one', () => {
      const [cave] = rows();
      should(render(cave)).containEql('<html lang="fr">');
      should(render({ ...cave, language: 'ENG' })).containEql(
        '<html lang="en">'
      );
      // No 2-letter code: the 3-letter one is the registered tag
      should(render({ ...cave, language: 'gsw' })).containEql(
        '<html lang="gsw">'
      );
      should(
        render({
          ...cave,
          language: null,
          page: { ...cave.page, language: null },
        })
      ).containEql('<html lang="fr">'); // the language of the first description
      should(
        render({
          ...cave,
          language: null,
          page: {
            ...cave.page,
            language: null,
            descriptions: [],
            entrances: [],
          },
        })
      ).containEql('<html lang="en">'); // no main name, no description: English
    });

    it('tags a description in another language than the page with its BCP 47 tag, and one in the same language not at all', () => {
      const [cave] = rows();
      const html = render({
        ...cave,
        page: {
          ...cave.page,
          descriptions: [
            description({ title: 'Same', language: 'fra' }),
            description({ title: 'Other', language: 'eng' }),
          ],
        },
      });
      should(html).containEql('<section lang="fr" dir="auto">\n<h3>Same</h3>');
      should(html).containEql('<section lang="en" dir="auto">\n<h3>Other</h3>');
      should(html).not.containEql('lang="eng"');
      should(html).not.containEql('lang="fra"');
    });

    it('reads each template from disk once, not on every page', () => {
      const [cave] = rows();
      render(cave);
      const read = sinon.spy(fs, 'readFileSync');
      try {
        render(cave);
        render({ ...cave, entity_id: 99 });
        should(read.callCount).equal(0);
      } finally {
        read.restore();
      }
    });

    it('refuses to render without the language tags, rather than render other bytes', () => {
      const [cave] = rows();
      should(() => BotRenderService.render(cave)).throw(TypeError, {
        message: /languageTags/,
      });
      should(() =>
        BotRenderService.render(cave, {
          languageTags: {},
          countryNames: COUNTRIES,
        })
      ).throw(TypeError, { message: /languageTags/ });
      // An empty map is explicit: every 3-letter code is kept
      should(
        BotRenderService.render(cave, {
          languageTags: new Map(),
          countryNames: COUNTRIES,
          hubLinks: BotRenderService.NO_HUB_LINKS,
        })
      ).containEql('<html lang="fra">');
    });

    it('refuses to render without the country names, rather than render the code where the generator wrote the name', () => {
      const [cave] = rows();
      should(() => BotRenderService.render(cave, { languageTags: TAGS })).throw(
        TypeError,
        { message: /countryNames/ }
      );
      should(() =>
        BotRenderService.render(cave, { languageTags: TAGS, countryNames: {} })
      ).throw(TypeError, { message: /countryNames/ });
      // An empty map is explicit: the country shows as its code
      const html = BotRenderService.render(cave, {
        languageTags: TAGS,
        countryNames: new Map(),
        hubLinks: BotRenderService.NO_HUB_LINKS,
      });
      should(html).containEql('<dd>FR</dd>');
      should(html).not.containEql('<dd>France</dd>');
    });

    it('reads the native name of each country from t_country', async () => {
      const names = await BotRenderService.loadCountryNames();
      should(names.get('ES')).equal('España');
      should(names.get('FR')).equal('France');
      should(names.size).be.above(0);
      // One string per country, not a set of translations
      should(
        Array.from(names.values()).every((n) => typeof n === 'string')
      ).be.true();
    });

    it('reads the 2-letter codes from t_language', async () => {
      const tags = await BotRenderService.loadLanguageTags();
      should(tags.get('fra')).equal('fr');
      should(tags.get('eng')).equal('en');
      should(tags.get('bod')).equal('bo');
    });

    it('puts the name in the title and escapes it', () => {
      const html = render(rows()[0]);
      should(html).containEql(
        '<title>Gouffre &lt;Test&gt; &amp; Cie - Grottocenter</title>'
      );
      should(html).not.containEql('<Test>');
    });

    it('links to the public address of the page and of the related pages', () => {
      const [cave, , massif] = rows();
      const caveHtml = render(cave, { baseUrl: BASE_URL });
      should(caveHtml).containEql(
        '<link rel="canonical" href="https://example.test/ui/caves/12">'
      );
      should(caveHtml).containEql('href="https://example.test/ui/massifs/3"');

      const massifHtml = render(massif, { baseUrl: BASE_URL });
      should(massifHtml).containEql('href="https://example.test/ui/caves/12"');
      should(massifHtml).containEql('href="https://example.test/ui/caves/14"');
    });

    it('defaults to the configured public base URL', () => {
      should(render(rows()[1])).containEql(
        'href="https://grottocenter.org/ui/caves/13"'
      );
    });

    it('renders the fields of the page', () => {
      const html = render(rows()[0]);
      [
        '250 m',
        '7 °C',
        'Lans',
        'Isère',
        '1950',
        'Auvergne-Rhône-Alpes',
        'Access',
      ].forEach((text) => should(html).containEql(text));
      // Unknown values are left out, not printed as null
      should(html).not.containEql('Longueur');
      should(html).not.containEql('null');
      // A description in another language than the page says so
      should(html).containEql('lang="en');
    });

    it('renders a description on lines and escapes it', () => {
      const [cave] = rows();
      const html = render({
        ...cave,
        page: {
          ...cave.page,
          descriptions: [description({ body: '<script>alert(1)</script>\nx' })],
        },
      });
      should(html).containEql('&lt;script&gt;alert(1)&lt;/script&gt;\nx');
      // The only script element is the JSON-LD block
      should(html.match(/<script/g)).have.length(1);
    });
  });

  describe('the website of an organization', () => {
    it('is a link marked nofollow ugc', () => {
      const html = render(rows()[3]);
      should(html).containEql(
        '<a href="https://example.org/club?a=1&amp;b=2" rel="nofollow ugc">'
      );
    });

    it('is left out when null', () => {
      should(render(rows()[4])).not.containEql('Site web');
    });

    it('is left out when it is not an http(s) address', () => {
      const [, , , organization] = rows();
      [
        // eslint-disable-next-line no-script-url
        'javascript:alert(1)',
        'data:text/html,x',
        'ftp://example.org',
        'not a url',
      ].forEach((url) => {
        const html = render({
          ...organization,
          page: { ...organization.page, url },
        });
        should(html).not.containEql('Site web');
        should(html).not.containEql(url);
      });
    });
  });

  describe('determinism', () => {
    it('renders the same bytes twice, and does not depend on lastmod', () => {
      const [cave] = rows();
      const first = render(cave);
      should(render(cave)).equal(first);
      should(
        render({
          ...cave,
          lastmod: new Date('2030-01-01'),
          page: { ...cave.page, lastmod: '2030-01-01T00:00:00Z' },
        })
      ).equal(first);
    });

    it('changes when a field shown changes', () => {
      const [cave] = rows();
      should(render({ ...cave, page: { ...cave.page, depth: 251 } })).not.equal(
        render(cave)
      );
    });
  });

  it('refuses a type it has no page for', () => {
    should(() =>
      render({
        entity_type: 'entrance',
        entity_id: 1,
        page: { name: 'x' },
      })
    ).throw(RangeError);
  });

  describe('404.html', () => {
    it('is noindex and says nothing about the request', () => {
      const html = BotRenderService.renderNotFound();
      should(html).containEql('<meta name="robots" content="noindex">');
      should(html).not.containEql('rel="canonical"');
    });

    it('is the only page that is noindex', () => {
      rows().forEach((row) => should(render(row)).not.containEql('noindex'));
    });
  });
});
