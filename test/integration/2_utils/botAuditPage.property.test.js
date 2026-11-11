const should = require('should');
const fc = require('fast-check');

describe('botAuditPage - Property: what the audit reads out of any text', () => {
  let botAuditPage;
  let detect;

  before(() => {
    // Sails re-requires api/ when it lifts: require the modules here
    /* eslint-disable global-require */
    botAuditPage = require('../../../api/utils/botAuditPage');
    ({ detect } = require('../../../api/utils/coordinateDetector'));
    /* eslint-enable global-require */
  });

  const TYPES = {
    cave: 'caves',
    massif: 'massifs',
    organization: 'organizations',
    entrance: 'entrances',
  };
  const ids = fc.uniqueArray(fc.integer({ min: 1, max: 2147483647 }), {
    maxLength: 8,
  });
  const idsByType = fc.record({
    cave: ids,
    massif: ids,
    organization: ids,
    entrance: ids,
  });

  it('recordRefs gives back exactly the ids a page was built from, whatever the text around them', () => {
    // Covers every record type, ids over the whole integer range and
    // arbitrary surrounding text (which holds no "/<directory>/<id>" itself)
    // Page text is HTML-escaped: no raw `<`, and none of the "/<directory>/<id>"
    const filler = fc.string().map((text) => text.replace(/[/<]/g, ' '));
    fc.assert(
      fc.property(idsByType, filler, filler, (byType, before, after) => {
        const links = Object.entries(byType).flatMap(([type, list]) =>
          list.map(
            (id) =>
              `<a href="https://x.test/ui/${TYPES[type]}/${id}">${before}</a>`
          )
        );
        const html = `${before}${links.join(after)}${after}`;
        const found = botAuditPage.recordRefs(html, 'https://x.test/ui');
        Object.keys(TYPES).forEach((type) => {
          should(found[type]).eql([...byType[type]].sort((a, b) => a - b));
        });
        should(found.foreign).equal(0);
      }),
      { numRuns: 100 }
    );
  });

  it('detectionText never throws and always gives strings, on any input including broken markup', () => {
    fc.assert(
      fc.property(
        fc.string({ unit: 'binary' }),
        fc.constantFrom('', '<', '<script>', '<!--', '<style>', '&#', '"'),
        (text, glue) => {
          const { body, jsonLd } = botAuditPage.detectionText(
            `${glue}${text}${glue}`
          );
          should(body).be.a.String();
          should(jsonLd).be.a.String();
          // And the detector accepts them
          detect(body);
          detect(jsonLd);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('a coordinate pair is found in the body wherever it sits in the markup, however much is around it', () => {
    // The pair is written the way the templates escape it; the wrapper puts it
    // in an element, an attribute value or a comment
    const lat = fc.integer({ min: 0, max: 89 });
    const min = fc.integer({ min: 0, max: 59 });
    const wrap = fc.constantFrom(
      (t) => `<p>${t}</p>`,
      (t) => `<meta name="description" content="${t}">`,
      (t) => `<!-- ${t} -->`,
      (t) => `<dd><b>${t}</b></dd>`
    );
    fc.assert(
      fc.property(
        lat,
        min,
        min,
        fc.integer({ min: 0, max: 179 }),
        wrap,
        (d1, m1, s1, d2, wrapper) => {
          const text = `${d1}°${String(m1).padStart(2, '0')}&#39;${String(s1).padStart(2, '0')}&quot;N ${d2}°10&#39;20&quot;E`;
          const { body } = botAuditPage.detectionText(
            `<html><body>${wrapper(text)}</body></html>`
          );
          should(detect(body).matched).be.true();
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('botAuditPage - Property: the shaping adds no false positive over real renderer output', () => {
  let botAuditPage;
  let BotRenderService;
  let detect;

  before(() => {
    // Sails re-requires api/ when it lifts: require the modules here
    /* eslint-disable global-require */
    botAuditPage = require('../../../api/utils/botAuditPage');
    BotRenderService = require('../../../api/services/bot/BotRenderService');
    ({ detect } = require('../../../api/utils/coordinateDetector'));
    /* eslint-enable global-require */
  });

  // Prose full of the numbers a cave page holds: depths, lengths, years,
  // counts, units and punctuation, none of them a position on their own
  const word = fc.oneof(
    { weight: 4, arbitrary: fc.stringMatching(/^[a-zà-ÿ]{2,9}$/) },
    { weight: 2, arbitrary: fc.integer({ min: 0, max: 99999 }).map(String) },
    {
      weight: 2,
      arbitrary: fc
        .tuple(
          fc.integer({ min: 0, max: 5000 }),
          fc.integer({ min: 1, max: 99 })
        )
        .map(([whole, fraction]) => `${whole}.${fraction}`),
    },
    {
      weight: 2,
      arbitrary: fc.constantFrom(
        'm',
        '°C',
        'km',
        '-',
        '/',
        ',',
        '.',
        ':',
        '(',
        ')',
        '&',
        "d'",
        '"'
      ),
    }
  );
  const text = fc
    .array(word, { minLength: 1, maxLength: 25 })
    .map((words) => words.join(' '));
  const measure = fc.oneof(
    fc.integer({ min: 0, max: 3000 }),
    fc.integer({ min: 0, max: 300000 }).map((n) => n / 100)
  );
  const entrance = fc.record({
    name: text,
    city: text,
    county: text,
    region: text,
    discoveryYear: fc.integer({ min: 1800, max: 2026 }),
  });

  const renderCave = ({ name, depth, length, descriptions, entrances }) =>
    BotRenderService.render(
      {
        entity_type: 'cave',
        entity_id: 12,
        language: 'fra',
        lastmod: new Date('2026-01-01T00:00:00Z'),
        page: {
          id: 12,
          name,
          language: 'fra',
          depth,
          length,
          descriptions: descriptions.map((d) => ({ ...d, language: 'fra' })),
          entrances,
          massifs: [],
        },
      },
      {
        baseUrl: 'https://example.test/ui',
        languageTags: new Map(),
        countryNames: new Map(),
        hubLinks: BotRenderService.NO_HUB_LINKS,
      }
    );

  // Found by this property on CI (seed 461139179): the JSON-LD read as written
  // joins a name, a city, a county and a region with quotes and commas, so
  // `utmà","city":"0.1","county":"aà","region":"10000` looked like a UTM
  // position, which is nowhere on the page. The JSON-LD is read as lines now.
  it('does not read the fields of the JSON-LD as one text: a name ending in a label, then numbers in other fields, is not a position', () => {
    const html = renderCave({
      name: 'm',
      depth: 0,
      length: 0,
      descriptions: [],
      entrances: [
        {
          name: 'utmà',
          city: '0.1',
          county: 'aà',
          region: '10000 aa',
          discoveryYear: 1800,
        },
      ],
    });
    const shaped = botAuditPage.detectionText(html);
    should(detect(shaped.body)).eql({ matched: false });
    should(detect(shaped.jsonLd)).eql({ matched: false });
  });

  it('a cave page made of texts the detector accepts one by one is accepted as a page, CSS and JSON-LD included', () => {
    fc.assert(
      fc.property(
        text,
        measure,
        measure,
        fc.array(fc.record({ title: text, body: text }), { maxLength: 4 }),
        fc.array(entrance, { minLength: 1, maxLength: 3 }),
        (name, depth, length, descriptions, entrances) => {
          const sources = [
            name,
            ...descriptions.flatMap((d) => [d.title, d.body]),
            ...entrances.flatMap((e) => [e.name, e.city, e.county, e.region]),
          ];
          fc.pre(sources.every((source) => !detect(source).matched));
          const html = renderCave({
            name,
            depth,
            length,
            descriptions,
            entrances,
          });
          const shaped = botAuditPage.detectionText(html);
          should(detect(shaped.body)).eql({ matched: false });
          should(detect(shaped.jsonLd)).eql({ matched: false });
        }
      ),
      { numRuns: 200 }
    );
  });
});
