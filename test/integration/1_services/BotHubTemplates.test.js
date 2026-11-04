const fs = require('fs');
const path = require('path');
const should = require('should');
const { HtmlValidate } = require('html-validate/node');

const BASE_URL = 'https://example.test/ui';
const SNAPSHOT_DIR = path.join(__dirname, '../../snapshots/bot-pages');

const TAGS = new Map([
  ['fra', 'fr'],
  ['eng', 'en'],
  ['pol', 'pl'],
  ['ara', 'ar'],
  ['rus', 'ru'],
]);
// What loadCountryNames() reads from t_country: native_name (a subset)
const COUNTRIES = new Map([
  ['FR', 'France'],
  ['ES', 'España'],
  ['PL', 'Polska'],
  ['GB', 'United Kingdom'],
  ['DE', 'Deutschland'],
  ['AE', 'Émirats arabes unis'],
]);

const LASTMOD = new Date('2026-01-01T00:00:00Z');

const caves = [
  { id: 12, name: 'Berger (Aven du)', depth: 1271, length: 24000 },
  { id: 14, name: 'Scialet de la Pierre', depth: null, length: 800 },
  { id: 15, name: 'Trou sans fond', depth: 0, length: 0 },
];

const indexRow = (extra = {}, rowExtra = {}) => ({
  hub_type: 'index',
  hub_key: 'ALL',
  language: 'fra',
  lastmod: LASTMOD,
  page: {
    language: 'fra',
    lastmod: '2026-01-01T00:00:00Z',
    countries: [{ code: 'FR' }, { code: 'ES' }, { code: 'AE' }],
    ...extra,
  },
  ...rowExtra,
});

const countryRow = (extra = {}, rowExtra = {}) => ({
  hub_type: 'country',
  hub_key: 'FR',
  language: 'fra',
  lastmod: LASTMOD,
  page: {
    code: 'FR',
    language: 'fra',
    lastmod: '2026-01-01T00:00:00Z',
    regions: [
      { code: 'FR-ARA', name: 'Auvergne-Rhône-Alpes' },
      { code: 'FR-01', name: 'Ain' },
    ],
    massifs: [
      { id: 4, name: 'Chartreuse' },
      { id: 3, name: 'Vercors' },
    ],
    caves,
    ...extra,
  },
  ...rowExtra,
});

const regionRow = (extra = {}, rowExtra = {}) => ({
  hub_type: 'region',
  hub_key: 'FR-ARA',
  language: 'fra',
  lastmod: LASTMOD,
  page: {
    code: 'FR-ARA',
    name: 'Auvergne-Rhône-Alpes',
    country: 'FR',
    language: 'fra',
    lastmod: '2026-01-01T00:00:00Z',
    massifs: [{ id: 3, name: 'Vercors' }],
    caves,
    ...extra,
  },
  ...rowExtra,
});

const FIGURES = new Map([
  [
    'country:FR',
    {
      nbCaves: 1234,
      nbNetworks: 56,
      nbMassifs: 7,
      nbDivingCaves: 8,
      totalLength: 456789,
      avgDepth: 61,
      avgLength: 372,
    },
  ],
  [
    'country:ES',
    {
      nbCaves: 99,
      nbNetworks: null,
      nbMassifs: null,
      nbDivingCaves: null,
      totalLength: null,
      avgDepth: null,
      avgLength: null,
    },
  ],
  ['country:AE', { nbCaves: 3 }],
  [
    'region:FR-ARA',
    { nbCaves: 321, nbNetworks: 12, nbMassifs: 2, totalLength: 1000 },
  ],
  ['region:FR-01', { nbCaves: 45 }],
]);

const jsonLdBlocks = (html) =>
  [
    ...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs),
  ].map((m) => m[1]);

const parseJsonLd = (html) => {
  const blocks = jsonLdBlocks(html);
  should(blocks).have.length(1);
  return JSON.parse(blocks[0]);
};

describe('Bot hub pages - templates', () => {
  let BotRenderService;
  let BotHubService;
  let validator;

  before(() => {
    // Sails re-requires api/ when it lifts: require the services here
    /* eslint-disable global-require */
    BotRenderService = require('../../../api/services/bot/BotRenderService');
    BotHubService = require('../../../api/services/bot/BotHubService');
    /* eslint-enable global-require */
    validator = new HtmlValidate({ extends: ['html-validate:recommended'] });
  });

  const allHubsLinks = () =>
    BotHubService.createHubLinks(
      {
        countries: new Set(['FR', 'ES', 'GB', 'AE']),
        regions: new Set(['FR-ARA', 'FR-01', 'GB-CMN', 'ES-NA']),
        hasIndex: true,
      },
      BASE_URL
    );

  const render = (row, options = {}) =>
    BotRenderService.renderHub(row, {
      baseUrl: BASE_URL,
      languageTags: TAGS,
      countryNames: COUNTRIES,
      hubLinks: allHubsLinks(),
      hubFigures: FIGURES,
      ...options,
    });

  const expectValid = async (html) => {
    const report = await validator.validateString(html);
    should(
      report.results.flatMap((r) =>
        r.messages.map((m) => `${m.ruleId}: ${m.message}`)
      )
    ).deepEqual([]);
  };

  // Expected markup lives in test/snapshots/bot-pages (see BotPageTemplates)
  const expectSnapshot = (name, actual) => {
    const file = path.join(SNAPSHOT_DIR, `${name}.html`);
    if (process.env.UPDATE_SNAPSHOTS === '1') {
      fs.writeFileSync(file, actual);
    }
    should(fs.existsSync(file)).be.true();
    should(actual).equal(fs.readFileSync(file, 'utf8'));
  };

  describe('snapshots of the markup, on a fixed fixture', () => {
    it('countries index', () =>
      expectSnapshot('hub-index', render(indexRow())));
    it('country', () => expectSnapshot('hub-country', render(countryRow())));
    it('region', () => expectSnapshot('hub-region', render(regionRow())));
  });

  const pages = () => [
    ['index', render(indexRow())],
    ['country', render(countryRow())],
    ['region', render(regionRow())],
    [
      'hub with nothing optional',
      render(countryRow({ regions: [], massifs: [], caves: [] }), {}, {}),
    ],
  ];

  describe('every hub', () => {
    it('is valid HTML', async () => {
      for (const [, html] of pages()) {
        // eslint-disable-next-line no-await-in-loop
        await expectValid(html);
      }
    });

    it('has the licence footer, the generator marker and is not noindex', () => {
      pages().forEach(([, html]) => {
        should(html).containEql('rel="license"');
        should(html).containEql('CC-BY-SA');
        should(html).containEql('ODbL');
        should(html).containEql(
          '<meta name="generator" content="gc-static-pages">'
        );
        should(html).not.match(/noindex/);
        should(html).not.match(/hreflang/);
      });
    });

    it('has exactly one canonical link: its own address in the SPA, repeated in og:url', () => {
      [
        [indexRow(), 'countries'],
        [countryRow(), 'countries/FR'],
        [regionRow(), 'countries/FR/regions/ARA'],
      ].forEach(([row, tail]) => {
        const html = render(row);
        should(html.match(/<link rel="canonical"/g)).have.length(1);
        should(html).containEql(
          `<link rel="canonical" href="https://example.test/ui/${tail}">`
        );
        should(html).containEql(
          `<meta property="og:url" content="https://example.test/ui/${tail}">`
        );
      });
    });

    it('has a title made of the name and the brand, and a description', () => {
      should(render(countryRow())).containEql(
        '<title>France - Grottocenter</title>'
      );
      should(render(regionRow())).containEql(
        '<title>Auvergne-Rhône-Alpes - Grottocenter</title>'
      );
      should(render(indexRow())).containEql(
        '<title>Pays - Grottocenter</title>'
      );
      should(render(countryRow())).containEql(
        '<meta name="description" content="Pays: France. cavités: 1234. Régions: Ain, Auvergne-Rhône-Alpes.">'
      );
    });
  });

  describe('the JSON-LD', () => {
    it('is one parseable block, a CollectionPage named by its address, listing what the page links to', () => {
      const data = parseJsonLd(render(countryRow()));
      should(data).containEql({
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        '@id': 'https://example.test/ui/countries/FR',
        name: 'France',
        inLanguage: 'fr',
      });
      should(data.mainEntity.itemListElement.map((item) => item.url)).deepEqual(
        [
          'https://example.test/ui/countries/FR/regions/01',
          'https://example.test/ui/countries/FR/regions/ARA',
          'https://example.test/ui/massifs/4',
          'https://example.test/ui/massifs/3',
          'https://example.test/ui/caves/12',
          'https://example.test/ui/caves/14',
          'https://example.test/ui/caves/15',
        ]
      );
      should(
        data.mainEntity.itemListElement.map((item) => item.position)
      ).deepEqual([1, 2, 3, 4, 5, 6, 7]);
    });

    it('never carries a position, a bounding box or a polygon', () => {
      pages().forEach(([, html]) => {
        const block = jsonLdBlocks(html)[0];
        should(block).not.match(
          /geo|latitude|longitude|coordinates|bbox|boundingBox|polygon|point_geom/i
        );
      });
    });

    it('cannot be closed early by a name: every < is escaped, and the block parses back to the name', () => {
      const evil = '</script><script>alert(1)</script><!--';
      const html = render(
        regionRow({
          caves: [{ id: 1, name: evil, depth: 1, length: 1 }],
        })
      );
      should(html.match(/<script type="application\/ld\+json">/g)).have.length(
        1
      );
      should(html.match(/<\/script>/g)).have.length(1);
      const data = parseJsonLd(html);
      should(data.mainEntity.itemListElement.map((i) => i.name)).containEql(
        evil
      );
      // And the HTML list escapes it
      should(html).containEql('&lt;/script&gt;');
    });
  });

  describe('the language', () => {
    it('uses the labels of the language of the row: French for France', () => {
      const html = render(countryRow());
      should(html).containEql('<html lang="fr">');
      should(html).containEql('<h2>Régions</h2>');
      should(html).containEql('<h2>Massifs</h2>');
    });

    it('uses English labels, and the language tag, when the front has no translation for the language', () => {
      const html = render(countryRow({ language: 'pol' }, { language: 'pol' }));
      should(html).containEql('<html lang="pl">');
      should(html).containEql('<h2>Regions</h2>');
      should(html).not.containEql('Régions');
    });

    it('is English when the hub has no language at all', () => {
      const html = render(countryRow({ language: null }, { language: null }));
      should(html).containEql('<html lang="en">');
      should(html).containEql('<h2>Regions</h2>');
    });

    it('is laid out right to left in a right-to-left language', () => {
      should(
        render(countryRow({ language: 'ara' }, { language: 'ara' }))
      ).containEql('<html lang="ar" dir="rtl">');
    });
  });

  describe('the names', () => {
    it('shows a country by its native name, whatever the language of the page', () => {
      const html = render(countryRow({ code: 'ES' }, { hub_key: 'ES' }));
      should(html).containEql('<h1>España</h1>');
    });

    it('shows the name of a region without its [bracketed alternatives] and its trailing asterisk', () => {
      const gb = render(
        regionRow(
          {
            code: 'GB-CMN',
            name: 'Carmarthenshire [Sir Gaerfyrddin GB-GFY]',
            country: 'GB',
          },
          { hub_key: 'GB-CMN', language: 'eng' }
        )
      );
      should(gb).containEql('<h1>Carmarthenshire</h1>');
      should(gb).not.containEql('Gaerfyrddin');
      should(gb).not.match(/<h1>[^<]*\[/);
      const es = render(
        regionRow(
          { code: 'ES-NA', name: 'Nafarroa*', country: 'ES' },
          { hub_key: 'ES-NA', language: 'spa' }
        )
      );
      should(es).containEql('<h1>Nafarroa</h1>');
      should(es).not.containEql('*');
      // The same in the list of the regions of a country
      const country = render(
        countryRow({
          code: 'ES',
          regions: [{ code: 'ES-NA', name: 'Nafarroa*' }],
        }),
        {}
      );
      should(country).containEql('>Nafarroa</a>');
    });
  });

  describe('the lists', () => {
    it('sorts the countries, the regions and the massifs by name, ignoring accents and case, and keeps the order of the view for the caves', () => {
      const index = render(
        indexRow({
          countries: [{ code: 'FR' }, { code: 'AE' }, { code: 'ES' }],
        })
      );
      const order = ['Émirats arabes unis', 'España', 'France'].map((name) =>
        index.indexOf(`>${name}</a>`)
      );
      should(order.every((i) => i > 0)).be.true();
      should([...order].sort((a, b) => a - b)).deepEqual(order);

      const country = render(countryRow());
      should(country.indexOf('>Ain</a>')).be.below(
        country.indexOf('>Auvergne-Rhône-Alpes</a>')
      );
      should(country.indexOf('>Chartreuse</a>')).be.below(
        country.indexOf('>Vercors</a>')
      );
      // Berger, Scialet, Trou: the order of the rows
      should(country.indexOf('>Berger (Aven du)</a>')).be.below(
        country.indexOf('>Scialet de la Pierre</a>')
      );
    });

    it('shows the number of caves of the SPA next to each country and region, and leaves it out when the statistics have none', () => {
      const index = render(indexRow());
      should(index).containEql(
        '<a href="https://example.test/ui/countries/FR">France</a>, cavités: 1234'
      );
      should(index).containEql('>España</a>, cavités: 99');
      should(index).containEql('>Émirats arabes unis</a>, cavités: 3');
      const country = render(countryRow());
      should(country).containEql('>Ain</a>, cavités: 45');
      // No statistics for a region: no figure
      const empty = render(countryRow(), { hubFigures: new Map() });
      should(empty).not.match(/cavités: \d/);
    });

    it('links the countries, regions, massifs and caves by their address in the SPA, with depth and length when known', () => {
      const html = render(countryRow());
      [
        '<a href="https://example.test/ui/countries/FR/regions/ARA">Auvergne-Rhône-Alpes</a>',
        '<a href="https://example.test/ui/massifs/3">Vercors</a>',
        '<li><a href="https://example.test/ui/caves/12">Berger (Aven du)</a>, Profondeur: 1271 m, Longueur: 24000 m</li>',
        '<li><a href="https://example.test/ui/caves/14">Scialet de la Pierre</a>, Longueur: 800 m</li>',
        '<li><a href="https://example.test/ui/caves/15">Trou sans fond</a></li>',
      ].forEach((text) => should(html).containEql(text));
    });
  });

  describe('the links to other hubs', () => {
    const only = (countries, regions) =>
      BotHubService.createHubLinks(
        {
          countries: new Set(countries),
          regions: new Set(regions),
          hasIndex: true,
        },
        BASE_URL
      );

    it('lists and links a region only when its hub is published', () => {
      const html = render(countryRow(), {
        hubLinks: only(['FR'], ['FR-01']),
      });
      should(html).containEql('>Ain</a>');
      should(html).not.containEql('Auvergne-Rhône-Alpes');
      should(html).not.containEql('regions/ARA');
      should(
        parseJsonLd(html).mainEntity.itemListElement.map((i) => i.name)
      ).not.containEql('Auvergne-Rhône-Alpes');
      // None published: no heading
      const none = render(countryRow(), { hubLinks: only(['FR'], []) });
      should(none).not.containEql('<h2>Régions</h2>');
    });

    it('lists and links a country of the index only when its hub is published', () => {
      const html = render(indexRow(), { hubLinks: only(['FR', 'ES'], []) });
      should(html).containEql('>France</a>');
      should(html).containEql('>España</a>');
      should(html).not.containEql('Émirats');
    });

    it('does not take a region for another country: the code has to start with the country', () => {
      const html = render(countryRow({ code: 'FR' }), {
        hubLinks: only(['FR'], ['GB-CMN']),
      });
      should(html).not.containEql('<h2>Régions</h2>');
    });
  });

  describe('the figures', () => {
    it('are the ones handed over, worded as the SPA words them, in a fixed order, a null figure left out', () => {
      const html = render(countryRow());
      should(html).containEql(
        [
          '<ul class="figures">',
          '<li><strong>1234</strong> cavités (1 ou plusieurs entrées)</li>',
          '<li><strong>56</strong> réseaux (cavité avec plus d&#39;une entrée)</li>',
          '<li><strong>7</strong> massifs</li>',
          '<li><strong>8</strong> cavités permettent de faire de la plongée</li>',
          '<li><strong>456789 m</strong> Développement cumulé</li>',
          '<li><strong>61 m</strong> Profondeur moyenne</li>',
          '<li><strong>372 m</strong> Développement moyen</li>',
          '</ul>',
        ].join('\n')
      );
      // The list of caves is not titled with the networks' word
      should(html).containEql('<h2>Cavités</h2>');
      should(html).not.containEql('<h2>Réseaux</h2>');
      const region = render(regionRow());
      should(region).containEql(
        '<li><strong>321</strong> cavités (1 ou plusieurs entrées)</li>'
      );
      should(region).not.containEql('Profondeur moyenne');
    });

    it('uses the plural rules of the labels, English for a Russian hub: 21 caves, not 21 cave', () => {
      const html = render(
        countryRow({ language: 'rus' }, { language: 'rus' }),
        {
          hubFigures: new Map([
            ['country:FR', { nbCaves: 21, nbNetworks: 31, nbDivingCaves: 1 }],
          ]),
        }
      );
      should(html).containEql('<html lang="ru">');
      should(html).containEql(
        '<li><strong>21</strong> caves (1 or multiple entrances)</li>'
      );
      should(html).containEql('<li><strong>31</strong> networks');
      should(html).containEql('<li><strong>1</strong> cave is diveable</li>');
    });

    it('show no list when the hub has no figures at all', () => {
      should(render(countryRow(), { hubFigures: new Map() })).not.containEql(
        'class="figures"'
      );
    });
  });

  describe('the breadcrumb', () => {
    const crumbs = (html) =>
      (html.match(/<nav class="breadcrumb">.*?<\/nav>/s) || [''])[0];

    it('goes from the countries index to the country, then the region, which is not a link', () => {
      should(crumbs(render(regionRow()))).equal(
        '<nav class="breadcrumb">\n<ol>\n<li><a href="https://example.test/ui/countries">Pays</a></li>\n<li><a href="https://example.test/ui/countries/FR">France</a></li>\n<li>Auvergne-Rhône-Alpes</li>\n</ol>\n</nav>'
      );
    });

    it('does not link a country whose hub is not published, nor the index when it is not', () => {
      const html = render(regionRow(), {
        hubLinks: BotRenderService.NO_HUB_LINKS,
      });
      const nav = crumbs(html);
      should(nav).containEql('<li>France</li>');
      should(nav).containEql('<li>Pays</li>');
      should(nav).not.containEql('<a');
    });

    it('has none on the index', () => {
      should(crumbs(render(indexRow()))).equal('');
    });
  });

  describe('what a hub refuses', () => {
    it('refuses to render without the figures, the hub links, the language tags or the country names', () => {
      const row = countryRow();
      const base = {
        baseUrl: BASE_URL,
        languageTags: TAGS,
        countryNames: COUNTRIES,
        hubLinks: allHubsLinks(),
        hubFigures: FIGURES,
      };
      [
        ['hubFigures', /hubFigures/],
        ['hubLinks', /hubLinks/],
        ['languageTags', /languageTags/],
        ['countryNames', /countryNames/],
      ].forEach(([key, message]) => {
        const options = { ...base };
        delete options[key];
        should(() => BotRenderService.renderHub(row, options)).throw(
          TypeError,
          { message }
        );
      });
    });

    it('refuses a hub type it does not know', () => {
      should(() => render({ ...countryRow(), hub_type: 'municipality' })).throw(
        RangeError
      );
    });

    it('drops a key of the row that the whitelist does not name', () => {
      const html = render(
        countryRow({
          latitude: 45.1,
          geogPolygon: 'POLYGON((0 0))',
          isSensitive: true,
        })
      );
      should(html).not.match(/45\.1|POLYGON|isSensitive/);
    });
  });
});
