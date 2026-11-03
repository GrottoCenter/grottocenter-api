const fs = require('fs');
const path = require('path');
const should = require('should');
const { HtmlValidate } = require('html-validate/node');

const BASE_URL = 'https://example.test/ui';
const SNAPSHOT_DIR = path.join(__dirname, '../../snapshots/bot-pages');

// What loadLanguageTags() reads from t_language
const TAGS = new Map([
  ['fra', 'fr'],
  ['eng', 'en'],
  ['por', 'pt'],
  ['spa', 'es'],
  ['pol', 'pl'],
  ['heb', 'he'],
  ['ara', 'ar'],
]);

// What loadCountryNames() reads from t_country: native_name (a subset)
const COUNTRIES = new Map([
  ['FR', 'France'],
  ['PT', 'Portugal'],
  ['PL', 'Polska'],
  ['ES', 'España'],
]);

const description = (extra = {}) => ({
  title: 'Access',
  body: 'First line\nSecond line',
  language: 'fra',
  ...extra,
});

const entrance = (id, extra = {}) => ({
  id,
  name: `Entrance ${id}`,
  language: 'fra',
  city: 'Lans-en-Vercors',
  county: 'Isère',
  region: 'Auvergne-Rhône-Alpes',
  regionCode: 'FR-ARA',
  country: 'FR',
  discoveryYear: 1953,
  dangerCo2: false,
  dangerFlooding: true,
  hasBat: true,
  descriptions: [],
  ...extra,
});

const caveRow = (pageExtra = {}, rowExtra = {}) => ({
  entity_type: 'cave',
  entity_id: 12,
  language: 'fra',
  lastmod: new Date('2026-01-01T00:00:00Z'),
  page: {
    id: 12,
    name: 'Berger (Aven du)',
    language: 'fra',
    depth: 1271,
    length: 24000,
    temperature: 5,
    isDiving: false,
    lastmod: '2026-01-01T00:00:00Z',
    descriptions: [
      description({ title: 'Overview', language: 'eng', body: 'English text' }),
      description({ title: 'Présentation', body: 'Texte\nen français' }),
    ],
    massifs: [{ id: 3, name: 'Vercors' }],
    entrances: [
      entrance(21, {
        name: 'Aven du Berger',
        descriptions: [description({ title: 'Accès', body: 'Par le sentier' })],
      }),
    ],
    ...pageExtra,
  },
  ...rowExtra,
});

const massifRow = () => ({
  entity_type: 'massif',
  entity_id: 3,
  language: 'fra',
  lastmod: new Date('2026-01-01T00:00:00Z'),
  page: {
    id: 3,
    name: 'Vercors',
    language: 'fra',
    lastmod: '2026-01-01T00:00:00Z',
    descriptions: [description({ title: 'Géologie', body: 'Un plateau.' })],
    caves: [
      { id: 12, name: 'Berger (Aven du)', depth: 1271, length: 24000 },
      { id: 14, name: 'Scialet de la Pierre', depth: null, length: 800 },
      { id: 15, name: 'Trou sans fond', depth: 0, length: 0 },
    ],
  },
});

const organizationRow = () => ({
  entity_type: 'organization',
  entity_id: 8,
  language: 'fra',
  lastmod: new Date('2026-01-01T00:00:00Z'),
  page: {
    id: 8,
    name: 'Spéléo Club "Les Gouffres" & Cie',
    language: 'fra',
    city: 'Lyon',
    county: 'Rhône',
    region: 'Auvergne-Rhône-Alpes',
    country: 'FR',
    url: 'https://example.org/club?a=1&b=2',
    yearBirth: 1950,
    lastmod: '2026-01-01T00:00:00Z',
  },
});

const jsonLdBlocks = (html) =>
  [
    ...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs),
  ].map((m) => m[1]);

const parseJsonLd = (html) => {
  const blocks = jsonLdBlocks(html);
  should(blocks).have.length(1);
  return JSON.parse(blocks[0]);
};

describe('Bot page templates', () => {
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
      baseUrl: BASE_URL,
      languageTags: TAGS,
      countryNames: COUNTRIES,
      hubLinks: BotRenderService.NO_HUB_LINKS,
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

  // Expected markup lives in test/snapshots/bot-pages. A change to the
  // published markup fails here and shows up in the diff of the PR; rewrite
  // the files with `UPDATE_SNAPSHOTS=1 npx cross-env NODE_ENV=test mocha ...`.
  const expectSnapshot = (name, actual) => {
    const file = path.join(SNAPSHOT_DIR, `${name}.html`);
    if (process.env.UPDATE_SNAPSHOTS === '1') {
      fs.writeFileSync(file, actual);
    }
    should(fs.existsSync(file)).be.true();
    should(actual).equal(fs.readFileSync(file, 'utf8'));
  };

  describe('snapshots of the markup, on a fixed fixture', () => {
    it('cave', () => expectSnapshot('cave', render(caveRow())));
    it('massif', () => expectSnapshot('massif', render(massifRow())));
    it('organization', () =>
      expectSnapshot('organization', render(organizationRow())));
    it('redirect', () =>
      expectSnapshot(
        'redirect',
        BotRenderService.renderRedirect('cave', 42, { baseUrl: BASE_URL })
      ));
  });

  describe('every page type', () => {
    const pages = () => [
      ['cave', render(caveRow())],
      ['massif', render(massifRow())],
      ['organization', render(organizationRow())],
      ['cave with no optional field', render(caveRow({ entrances: [] }))],
      [
        'redirect',
        BotRenderService.renderRedirect('massif', 7, { baseUrl: BASE_URL }),
      ],
      ['404', BotRenderService.renderNotFound({ baseUrl: BASE_URL })],
    ];

    it('is valid HTML', async () => {
      for (const [, html] of pages()) {
        // eslint-disable-next-line no-await-in-loop
        await expectValid(html);
      }
    });

    it('has the licence footer and the generator marker', () => {
      pages().forEach(([, html]) => {
        should(html).containEql('rel="license"');
        should(html).containEql('CC-BY-SA');
        should(html).containEql('ODbL');
        should(html).containEql(
          '<meta name="generator" content="gc-static-pages">'
        );
      });
    });

    it('has exactly one canonical link on a content page, the address of the page itself', () => {
      [
        [caveRow(), 'caves/12'],
        [massifRow(), 'massifs/3'],
        [organizationRow(), 'organizations/8'],
      ].forEach(([row, tail]) => {
        const html = render(row);
        should(html.match(/<link rel="canonical"/g)).have.length(1);
        should(html).containEql(
          `<link rel="canonical" href="https://example.test/ui/${tail}">`
        );
      });
    });

    it('is not noindex on a content page', () => {
      [caveRow(), massifRow(), organizationRow()].forEach((row) =>
        should(render(row)).not.match(/noindex/)
      );
    });

    it('carries a description made of whitelisted fields, and OG tags: og:url is the canonical, og:image the site default', () => {
      const html = render(caveRow());
      should(html).containEql(
        '<meta name="description" content="Cavité: Berger (Aven du). Profondeur: 1271 m. Longueur: 24000 m. Lans-en-Vercors, Auvergne-Rhône-Alpes, France.">'
      );
      should(html).containEql(
        '<meta property="og:url" content="https://example.test/ui/caves/12">'
      );
      should(html).containEql(
        '<meta property="og:image" content="https://example.test/og-image.png">'
      );
      should(html).containEql(
        '<meta property="og:title" content="Berger (Aven du) - Grottocenter">'
      );
      should(html).containEql('<meta property="og:type" content="website">');
      should(html).containEql(
        '<meta property="og:description" content="Cavité: Berger (Aven du).'
      );
    });

    it('has no hreflang alternate', () => {
      pages().forEach(([, html]) => should(html).not.match(/hreflang/));
    });

    it('has one parseable JSON-LD block on a content page, none elsewhere', () => {
      [caveRow(), massifRow(), organizationRow()].forEach((row) => {
        const data = parseJsonLd(render(row));
        should(data['@context']).equal(
          'https://ontology.uis-speleo.org/grottocenter.org_context.jsonld'
        );
      });
      should(jsonLdBlocks(BotRenderService.renderNotFound())).have.length(0);
    });

    it('types the JSON-LD with the @type of the mapping models, and names the page by its address', () => {
      should(parseJsonLd(render(caveRow()))).containEql({
        '@type': 'https://ontology.uis-speleo.org/ontology/#UndergroundCavity',
        '@id': 'https://example.test/ui/caves/12',
        name: 'Berger (Aven du)',
        depth: 1271,
        length: 24000,
      });
      should(parseJsonLd(render(massifRow()))).containEql({
        '@type': 'http://purl.org/dc/terms/Massif',
        '@id': 'https://example.test/ui/massifs/3',
      });
      should(parseJsonLd(render(organizationRow()))).containEql({
        '@type': 'http://purl.org/dc/terms/Location',
        '@id': 'https://example.test/ui/organizations/8',
        yearBirth: 1950,
      });
    });
  });

  describe('the title', () => {
    const titleOf = (name) =>
      render(caveRow({ name })).match(/<title>(.*?)<\/title>/)[1];

    it('is the name and the brand', () => {
      should(titleOf('Berger')).equal('Berger - Grottocenter');
    });

    it('is cut in the name part to 60 characters, keeping the brand suffix', () => {
      const title = titleOf('A'.repeat(100));
      should(Array.from(title)).have.length(60);
      should(title).equal(`${'A'.repeat(44)}… - Grottocenter`);
    });

    it('keeps a name that fits exactly, and cuts one character more', () => {
      should(titleOf('B'.repeat(45))).equal(`${'B'.repeat(45)} - Grottocenter`);
      should(titleOf('B'.repeat(46))).equal(
        `${'B'.repeat(44)}… - Grottocenter`
      );
    });

    it('does not cut a character in two', () => {
      const title = titleOf('𝒳'.repeat(80));
      should(Array.from(title)).have.length(60);
      should(title).not.match(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/);
      should(title).endWith('… - Grottocenter');
    });

    it('escapes the name', () => {
      should(titleOf('<b>&')).equal('&lt;b&gt;&amp; - Grottocenter');
    });
  });

  describe('what a cave page holds', () => {
    it('shows the names as stored, the facts, the entrance and its details', () => {
      const html = render(caveRow());
      [
        '<h1>Berger (Aven du)</h1>',
        '<dt>Profondeur</dt><dd>1271 m</dd>',
        '<dt>Longueur</dt><dd>24000 m</dd>',
        '<dt>Température</dt><dd>5 °C</dd>',
        '<h3>Aven du Berger</h3>',
        '<dt>Municipalité</dt><dd>Lans-en-Vercors</dd>',
        '<dt>Pays</dt><dd>France</dd>',
        '<dt>Année de découverte</dt><dd>1953</dd>',
        '<dt>Risque de crue</dt><dd>Oui</dd>',
        '<dt>Risque CO2</dt><dd>Non</dd>',
        'Par le sentier',
      ].forEach((text) => should(html).containEql(text));
      // Geology is not published; unknown flags are left out
      should(html).not.match(/[Gg][ée]ologi/);
      should(html).not.containEql('Risque de chute');
    });

    it('links to its massifs by their address in the SPA', () => {
      should(render(caveRow())).containEql(
        '<li><a href="https://example.test/ui/massifs/3">Vercors</a></li>'
      );
    });

    it('leaves out a depth or a length of 0, which means unknown', () => {
      const html = render(caveRow({ depth: 0, length: null }));
      should(html).not.containEql('Profondeur');
      should(html).not.containEql('Longueur');
    });

    it('has the same facts in the HTML and in the JSON-LD', () => {
      const row = caveRow({ depth: 321, length: 654 });
      const data = parseJsonLd(render(row));
      should(data.depth).equal(321);
      should(data.length).equal(654);
      should(data.entrances).have.length(1);
      should(data.entrances[0]).containEql({
        name: 'Aven du Berger',
        city: 'Lans-en-Vercors',
        country: 'France',
      });
      should(data.massifs).deepEqual([
        {
          '@id': 'https://example.test/ui/massifs/3',
          '@type': 'http://purl.org/dc/terms/Massif',
          name: 'Vercors',
        },
      ]);
    });
  });

  describe('what a massif page holds', () => {
    it('lists its caves with their depth and length, linked by their address in the SPA', () => {
      const html = render(massifRow());
      should(html).containEql(
        '<li><a href="https://example.test/ui/caves/12">Berger (Aven du)</a>, Profondeur: 1271 m, Longueur: 24000 m</li>'
      );
      should(html).containEql(
        '<li><a href="https://example.test/ui/caves/14">Scialet de la Pierre</a>, Longueur: 800 m</li>'
      );
      // A depth and a length of 0 are unknown
      should(html).containEql(
        '<li><a href="https://example.test/ui/caves/15">Trou sans fond</a></li>'
      );
    });

    it('has the caves in the JSON-LD too', () => {
      const data = parseJsonLd(render(massifRow()));
      should(data.caves.map((c) => c['@id'])).deepEqual([
        'https://example.test/ui/caves/12',
        'https://example.test/ui/caves/14',
        'https://example.test/ui/caves/15',
      ]);
      should(data.caves[2]).not.have.property('depth');
    });
  });

  describe('what an organization page holds', () => {
    it('shows the place, the website (a nofollow ugc link) and the year of foundation', () => {
      const html = render(organizationRow());
      [
        '<dt>Municipalité</dt><dd>Lyon</dd>',
        '<dt>Département</dt><dd>Rhône</dd>',
        '<dt>Région</dt><dd>Auvergne-Rhône-Alpes</dd>',
        '<dt>Pays</dt><dd>France</dd>',
        '<dt>Depuis</dt><dd>1950</dd>',
        '<dt>Site web</dt>',
        '<a href="https://example.org/club?a=1&amp;b=2" rel="nofollow ugc">',
      ].forEach((text) => should(html).containEql(text));
    });

    it('has no link for a website that is not an http(s) address', () => {
      const row = organizationRow();
      // eslint-disable-next-line no-script-url
      row.page.url = 'javascript:alert(1)';
      const html = render(row);
      should(html).not.containEql('Site web');
      should(html).not.containEql('javascript');
      should(parseJsonLd(html)).not.have.property('url');
    });
  });

  describe('the sensitive entrance', () => {
    // The view never contains a sensitive entrance. This input does, and
    // carries every field a careless projection could copy: the renderer must
    // publish only whitelisted fields, and leave out an entrance flagged sensitive
    const PUBLIC_COUNT = 14;
    const hostileRow = () => {
      const publics = Array.from({ length: PUBLIC_COUNT }, (_, i) =>
        entrance(100 + i, {
          name: `Public entrance ${i + 1}`,
          latitude: 45.1234567 + i,
          longitude: 5.7654321 + i,
          point_geom: `POINT(5.7654321 45.1234567)`,
          isSensitive: false,
          isSensitiveLocked: false,
          locations: [{ body: 'Park at 45.1234567 N' }],
        })
      );
      const secret = entrance(777, {
        name: 'Secret Sump',
        city: 'Secretville',
        latitude: 44.9999991,
        longitude: 6.0000009,
        isSensitive: true,
        descriptions: [description({ title: 'Secret way in', body: 'hidden' })],
      });
      const row = caveRow({
        entrances: [...publics.slice(0, 7), secret, ...publics.slice(7)],
        latitude: 45.5555555,
        longitude: 5.5555555,
        geo: { '@type': 'GeoCoordinates' },
        author: { id: 5, name: 'Some Caver', email: 'caver@example.org' },
        isSensitive: false,
      });
      return row;
    };

    it('leaves no coordinate and no trace of it in the page nor the JSON-LD', () => {
      const html = render(hostileRow());
      [
        'Secret Sump',
        'Secretville',
        'Secret way in',
        'hidden',
        '777',
        '44.9999991',
        '6.0000009',
        '45.1234567',
        '5.7654321',
        '45.5555555',
        '5.5555555',
        'POINT(',
        'Some Caver',
        'caver@example.org',
        'GeoCoordinates',
        'latitude',
        'longitude',
        'isSensitive',
        'Park at',
      ].forEach((text) => should(html).not.containEql(text));
      should(html).not.match(/\bgeo\b/);
    });

    it('shows the number of public entrances, never counting the sensitive one', () => {
      const html = render(hostileRow());
      should(html.match(/<h3>Public entrance \d+<\/h3>/g)).have.length(
        PUBLIC_COUNT
      );
      const data = parseJsonLd(html);
      should(data.entrances).have.length(PUBLIC_COUNT);
      should(data.entrances.map((e) => e.name)).not.containEql('Secret Sump');
    });

    it('is left out even when it is the only one the row carries', () => {
      const row = hostileRow();
      row.page.entrances = [row.page.entrances[7]];
      const html = render(row);
      should(html).not.containEql('Secret');
      should(html).not.containEql('777');
      should(parseJsonLd(html)).not.have.property('entrances');
    });
  });

  describe('a value that tries to close the JSON-LD block', () => {
    const PAYLOAD = '</script><script>alert(1)</script><!--';

    it('cannot break out: only the real block is in the page, and the value survives', () => {
      const row = caveRow({
        name: PAYLOAD,
        descriptions: [description({ title: PAYLOAD, body: PAYLOAD })],
        massifs: [{ id: 3, name: PAYLOAD }],
        entrances: [entrance(1, { name: PAYLOAD, city: PAYLOAD })],
      });
      const html = render(row);

      should(html.match(/<script/g)).have.length(1);
      should(html.match(/<\/script/g)).have.length(1);
      should(html).not.containEql('<!--');
      should(jsonLdBlocks(html)[0]).not.containEql('<');
      const data = parseJsonLd(html);
      should(data.name).equal(PAYLOAD);
      should(data.descriptions[0].body).equal(PAYLOAD);
      should(data.entrances[0].name).equal(PAYLOAD);
    });

    it('cannot break out of an organization or a massif block either', () => {
      const organization = organizationRow();
      organization.page.name = PAYLOAD;
      organization.page.city = PAYLOAD;
      const massif = massifRow();
      massif.page.name = PAYLOAD;
      [organization, massif].forEach((row) => {
        const html = render(row);
        should(html.match(/<script/g)).have.length(1);
        should(html.match(/<\/script/g)).have.length(1);
        should(parseJsonLd(html).name).equal(PAYLOAD);
      });
    });
  });

  describe('languages', () => {
    const polishCave = () =>
      caveRow(
        {
          name: 'Jaskinia Niedźwiedzia',
          language: 'pol',
          descriptions: [description({ language: 'pol', title: 'Opis' })],
          entrances: [entrance(1, { country: 'PL', regionCode: null })],
        },
        { language: 'pol' }
      );
    const portugueseCave = () =>
      caveRow(
        {
          name: 'Gruta do Almonda',
          language: 'por',
          descriptions: [description({ language: 'por', title: 'Descrição' })],
          entrances: [entrance(1, { country: 'PT', regionCode: null })],
        },
        { language: 'por' }
      );

    it('lays out a Hebrew or Arabic page right to left, and the others left to right', () => {
      const cave = (language) =>
        caveRow({ language, name: 'x', descriptions: [] }, { language });
      should(render(cave('heb'))).containEql('<html lang="he" dir="rtl">');
      should(render(cave('ara'))).containEql('<html lang="ar" dir="rtl">');
      should(render(cave('fra'))).containEql('<html lang="fr">');
      should(render(cave('fra'))).not.containEql('<html lang="fr" dir=');
      // The labels are the language's own, so a page in Hebrew reads in Hebrew
      should(render(cave('heb'))).not.containEql('<dt>Depth</dt>');
    });

    it('lets the browser pick the direction of a description in another language than the page', () => {
      const html = render(
        caveRow({
          descriptions: [
            description({ language: 'fra', title: 'Same' }),
            description({ language: 'heb', title: 'Other' }),
          ],
        })
      );
      should(html).containEql('<section lang="he" dir="auto">');
      should(html).containEql('<section>');
    });

    it('gives a Polish cave English labels and the Polish tag', () => {
      const html = render(polishCave());
      should(html).containEql('<html lang="pl">');
      should(html).containEql('<dt>Depth</dt>');
      should(html).containEql('<dt>Length</dt>');
      should(html).containEql('<h2>Entrances</h2>');
      should(html).containEql('<dt>Country</dt><dd>Polska</dd>');
      should(html).containEql('<h2>Massifs</h2>');
    });

    it('gives a Portuguese cave Portuguese labels and the native name of the country', () => {
      const html = render(portugueseCave());
      should(html).containEql('<html lang="pt">');
      should(html).containEql('<dt>Profundidade</dt>');
      should(html).containEql('<dt>Desenvolvimento</dt>');
      should(html).containEql('<h2>Entradas</h2>');
      should(html).containEql('<dt>País</dt><dd>Portugal</dd>');
      should(html).not.containEql('Profondeur');
    });

    it('names the country by its native name, whatever the language of the page', () => {
      const withCountry = (country, language) =>
        render(
          caveRow(
            { entrances: [entrance(1, { country, regionCode: null })] },
            { language }
          )
        );
      should(withCountry('ES', 'fra')).containEql('<dd>España</dd>');
      should(withCountry('ES', 'eng')).containEql('<dd>España</dd>');
      should(withCountry('ES', 'pol')).containEql('<dd>España</dd>');
      should(withCountry('PL', 'fra')).containEql('<dd>Polska</dd>');
    });

    it('puts the location of the first entrance that has one in the meta description, not of the first with any fact', () => {
      // Only flags on the first entrance, a location on the second
      const html = render(
        caveRow({
          entrances: [
            entrance(1, {
              city: null,
              county: null,
              region: null,
              regionCode: null,
              country: null,
              discoveryYear: null,
              dangerFlooding: null,
              dangerCo2: null,
              hasBat: false,
            }),
            entrance(2, { city: 'Lans-en-Vercors', country: 'FR' }),
          ],
        })
      );
      const metaDescription = html.match(
        /<meta name="description" content="([^"]*)">/
      )[1];
      should(metaDescription).containEql('Lans-en-Vercors');
      should(metaDescription).containEql('France');
    });

    it('shows the code of a country t_country does not know', () => {
      should(
        render(caveRow({ entrances: [entrance(1, { country: 'ZZ' })] }))
      ).containEql('<dd>ZZ</dd>');
    });

    it('takes the language of the first description when the record has no main name language, then English', () => {
      const noName = (page) => caveRow(page, { language: null });
      should(
        render(
          noName({
            language: null,
            descriptions: [description({ language: 'por' })],
          })
        )
      ).containEql('<html lang="pt">');
      should(
        render(
          noName({
            language: null,
            descriptions: [],
            entrances: [
              entrance(1, { descriptions: [description({ language: 'spa' })] }),
            ],
          })
        )
      ).containEql('<html lang="es">');
      should(
        render(noName({ language: null, descriptions: [], entrances: [] }))
      ).containEql('<html lang="en">');
    });

    it('puts the descriptions in the page language first, each in a section with its own language', () => {
      const html = render(
        caveRow({
          descriptions: [
            description({ language: 'eng', title: 'First in English' }),
            description({ language: 'spa', title: 'Texto' }),
            description({ language: 'fra', title: 'Premier en français' }),
            description({ language: null, title: 'Sans langue' }),
          ],
        })
      );
      const order = [
        'Premier en français',
        'Sans langue',
        'First in English',
        'Texto',
      ].map((title) => html.indexOf(`>${title}<`));
      should(order.every((i) => i > 0)).be.true();
      should([...order].sort((a, b) => a - b)).deepEqual(order);
      should(html).containEql(
        '<section lang="en" dir="auto">\n<h3>First in English'
      );
      should(html).containEql('<section lang="es" dir="auto">\n<h3>Texto');
      should(html).containEql('<section lang="fr" dir="auto">\n<h3>Premier');
      should(html).containEql('<section>\n<h3>Sans langue');
    });
  });

  describe('the breadcrumb', () => {
    const crumbs = (html) =>
      (html.match(/<nav class="breadcrumb">.*?<\/nav>/s) || [''])[0];

    it('names the country, the region and the cave, with no link while the hubs do not exist', () => {
      const nav = crumbs(render(caveRow()));
      should(nav).containEql('<li>France</li>');
      should(nav).containEql('<li>Auvergne-Rhône-Alpes</li>');
      should(nav).containEql('<li>Berger (Aven du)</li>');
      should(nav).not.containEql('<a');
    });

    it('refuses to render without the hub links, rather than render a breadcrumb without them', () => {
      const row = caveRow();
      const options = {
        baseUrl: BASE_URL,
        languageTags: TAGS,
        countryNames: COUNTRIES,
      };
      should(() => BotRenderService.render(row, options)).throw(TypeError, {
        message: /hubLinks/,
      });
      // Each of the two functions is needed
      [{}, { country: () => null }, { region: () => null }].forEach(
        (hubLinks) =>
          should(() =>
            BotRenderService.render(row, { ...options, hubLinks })
          ).throw(TypeError, { message: /needs hubLinks/ })
      );
      should(
        BotRenderService.render(row, {
          ...options,
          hubLinks: BotRenderService.NO_HUB_LINKS,
        })
      ).containEql('<html');
    });

    it('links a crumb only when the hook returns the address of a published hub', () => {
      const calls = [];
      const hubLinks = {
        country: (iso) => {
          calls.push(['country', iso]);
          return `${BASE_URL}/countries/${iso}`;
        },
        // The region hub is not published: no link
        region: (iso, code) => {
          calls.push(['region', iso, code]);
          return null;
        },
      };
      const nav = crumbs(render(caveRow(), { hubLinks }));
      should(nav).containEql(
        '<li><a href="https://example.test/ui/countries/FR">France</a></li>'
      );
      should(nav).containEql('<li>Auvergne-Rhône-Alpes</li>');
      should(nav).not.containEql('regions');
      should(calls).deepEqual([
        ['country', 'FR'],
        ['region', 'FR', 'FR-ARA'],
      ]);
    });

    it('links both crumbs to the region hub address when both are published', () => {
      const nav = crumbs(
        render(caveRow(), {
          hubLinks: {
            country: (iso) => `${BASE_URL}/countries/${iso}`,
            region: (iso) => `${BASE_URL}/countries/${iso}/regions/01`,
          },
        })
      );
      should(nav).containEql(
        '<a href="https://example.test/ui/countries/FR/regions/01">Auvergne-Rhône-Alpes</a>'
      );
      // The cave is the page itself: never a link
      should(nav).containEql('<li>Berger (Aven du)</li>');
    });

    it('is absent for a cave with no region code, and for massifs and organizations', () => {
      should(
        crumbs(
          render(caveRow({ entrances: [entrance(1, { regionCode: null })] }))
        )
      ).equal('');
      should(crumbs(render(massifRow()))).equal('');
      should(crumbs(render(organizationRow()))).equal('');
    });
  });

  describe('the redirect page', () => {
    it('sends the visitor to the target, names it as its canonical, and is noindex', () => {
      const html = BotRenderService.renderRedirect('cave', 42, {
        baseUrl: BASE_URL,
      });
      should(html).containEql(
        '<meta http-equiv="refresh" content="0; url=https://example.test/ui/caves/42">'
      );
      should(html).containEql(
        '<link rel="canonical" href="https://example.test/ui/caves/42">'
      );
      should(html.match(/<link rel="canonical"/g)).have.length(1);
      should(html).containEql('<meta name="robots" content="noindex">');
      should(html).containEql('<a href="https://example.test/ui/caves/42">');
      should(jsonLdBlocks(html)).have.length(0);
    });

    it('gives the target address as the redirectto metadata', () => {
      should(
        BotRenderService.redirectTarget('organization', 5, {
          baseUrl: BASE_URL,
        })
      ).equal('https://example.test/ui/organizations/5');
    });

    it('refuses a type that has no page', () => {
      should(() => BotRenderService.renderRedirect('entrance', 1)).throw(
        RangeError
      );
    });
  });
});
