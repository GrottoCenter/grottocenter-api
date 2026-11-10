const fs = require('fs');
const path = require('path');
const should = require('should');

const SNAPSHOTS = path.join(__dirname, '../../snapshots/bot-pages');

describe('botAuditPage - what the audit reads out of a page', () => {
  let botAuditPage;
  let detect;

  before(() => {
    // Sails re-requires api/ when it lifts: require the modules here
    /* eslint-disable global-require */
    botAuditPage = require('../../../api/utils/botAuditPage');
    ({ detect } = require('../../../api/utils/coordinateDetector'));
    /* eslint-enable global-require */
  });

  const page = ({ body = '', jsonLd, head = '' } = {}) =>
    `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8">${head}${
      jsonLd === undefined
        ? ''
        : `<script type="application/ld+json">${jsonLd}</script>`
    }<style>body{margin:0;padding:0.75rem 1rem;width:12.5%}</style></head><body><main>${body}</main></body></html>`;

  const verdicts = (html) => {
    const { body, jsonLd } = botAuditPage.detectionText(html);
    return { body: detect(body), jsonLd: detect(jsonLd) };
  };

  describe('detectionText', () => {
    const cleanPages = fs
      .readdirSync(SNAPSHOTS)
      .filter((name) => name.endsWith('.html'));

    it('has real pages to check', () => {
      should(cleanPages.length).be.aboveOrEqual(7);
    });

    cleanPages.forEach((name) => {
      it(`finds no coordinates in the snapshot page ${name}, CSS and JSON-LD included`, () => {
        const html = fs.readFileSync(path.join(SNAPSHOTS, name), 'utf8');
        const { body, jsonLd } = verdicts(html);
        should(body).eql({ matched: false });
        should(jsonLd).eql({ matched: false });
      });
    });

    it('finds nothing in the numbers a clean page is full of: depth, length, years, ids, dates, CSS', () => {
      const clean = page({
        head: '<meta name="description" content="Profondeur: 1271.5 m. Longueur: 24000 m. 2019-03-14, 1953">',
        body: '<dl><dt>Profondeur</dt><dd>1271.5 m</dd><dt>Longueur</dt><dd>24000.25 m</dd></dl><p>Cavité n° 12 explorée en 1953, 1961 et 2019-03-14. 87 cavités, 5 réseaux, 5 °C.</p><a href="https://grottocenter.org/ui/caves/123456">x</a>',
        jsonLd:
          '{"@id":"https://grottocenter.org/ui/caves/12","depth":1271.5,"length":24000,"position":3,"datePublished":"2019-03-14T10:11:12.123Z"}',
      });
      should(verdicts(clean)).eql({
        body: { matched: false },
        jsonLd: { matched: false },
      });
    });

    it('finds a coordinate in the text of the body, written the way the template escapes it', () => {
      const html = page({
        body: '<p class="text">Entrée: 46°06&#39;08&quot;N 6°30&#39;36&quot;E</p>',
      });
      const { body, jsonLd } = verdicts(html);
      should(body.matched).be.true();
      should(body.patternId).equal('dms');
      should(jsonLd.matched).be.false();
    });

    it('finds a coordinate written with numeric character references', () => {
      const html = page({ body: '<p>46&#176;06&#x27;08&#34;N</p>' });
      should(verdicts(html).body.matched).be.true();
    });

    it('finds a coordinate in an attribute value, a meta description for instance', () => {
      const html = page({
        head: '<meta name="description" content="Latitude 46.10222, longitude 6.51234">',
      });
      should(verdicts(html).body.matched).be.true();
    });

    it('finds a coordinate in an HTML comment', () => {
      should(
        verdicts(page({ body: '<!-- 46.10222, 6.51234 -->' })).body.matched
      ).be.true();
    });

    it('finds a coordinate in the JSON-LD, as numbers under a label', () => {
      const html = page({
        jsonLd:
          '{"@type":"Place","geo":{"latitude":46.10222,"longitude":6.51234}}',
      });
      const { body, jsonLd } = verdicts(html);
      should(body.matched).be.false();
      should(jsonLd.matched).be.true();
    });

    it('finds a coordinate in the JSON-LD hidden behind JSON escapes', () => {
      const html = page({
        jsonLd: '{"description":"46\\u00b006\'08\\"N 6\\u00b030\'36\\"E"}',
      });
      should(verdicts(html).jsonLd.matched).be.true();
    });

    it('keeps the contents of a script that is not JSON-LD', () => {
      const html = page({
        body: '<script>var p = "N 46.10222 E 6.51234";</script>',
      });
      should(verdicts(html).jsonLd.matched).be.true();
    });

    it('does not throw on JSON-LD that is not JSON, and still reads it as text', () => {
      const html = page({ jsonLd: '{broken, "latitude": 46.1' });
      should(verdicts(html).jsonLd.matched).be.true();
    });
  });

  describe('recordRefs', () => {
    it('lists the records a page links to or carries, by type, sorted and distinct', () => {
      const html = page({
        body: '<a href="https://grottocenter.org/ui/massifs/3">m</a><a href="/ui/caves/12">c</a><a href="/ui/caves/12">c</a><a href="/ui/entrances/77">e</a><a href="https://grottocenter.org/ui/organizations/8">o</a>',
        jsonLd: '{"@id":"https://grottocenter.org/ui/caves/9"}',
      });
      should(botAuditPage.recordRefs(html)).eql({
        cave: [9, 12],
        massif: [3],
        organization: [8],
        entrance: [77],
      });
    });

    it('reads the snapshot pages: the cave and the massif of the cave page', () => {
      const html = fs.readFileSync(path.join(SNAPSHOTS, 'cave.html'), 'utf8');
      should(botAuditPage.recordRefs(html)).eql({
        cave: [12],
        massif: [3],
        organization: [],
        entrance: [],
      });
    });

    it('ignores what is not a record: hubs, ids with a leading zero, over 10 digits or past the integer range', () => {
      const html = page({
        body: '<a href="/ui/countries/FR">f</a><a href="/ui/caves/012">z</a><a href="/ui/caves/99999999999">big</a><a href="/ui/caves/2147483648">over</a><a href="/ui/caves/0">zero</a>',
      });
      should(botAuditPage.recordRefs(html)).eql({
        cave: [],
        massif: [],
        organization: [],
        entrance: [],
      });
    });
  });
});
