const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');
const should = require('should');

const SNAPSHOTS = path.join(__dirname, '../../snapshots/bot-pages');
const BASE = 'https://grottocenter.org/ui';

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

    it('closes a script or a style on an unusual end tag, as a browser does, and still finds the coordinates', () => {
      const withScript = `<!DOCTYPE html><html><body><script type="application/ld+json">{"name":"Gouffre","latitude":46.1,"longitude":6.5}</script\t\n bar><p>after</p></body></html>`;
      const { body, jsonLd } = botAuditPage.detectionText(withScript);
      should(jsonLd).containEql('latitude');
      should(detect(jsonLd).matched).be.true();
      // The script is out of the body, the text after it is in
      should(body).not.containEql('latitude');
      should(body).containEql('after');

      const withStyle = '<style>a{color:red}</style foo><p>text</p>';
      const shaped = botAuditPage.detectionText(withStyle);
      should(shaped.body).not.containEql('color');
      should(shaped.body).containEql('text');
    });

    it('keeps a pair written as an array on one line, so GeoJSON coordinates are still found', () => {
      const html = page({
        jsonLd: '{"geo":{"coordinates":[6.51234,46.10222]}}',
      });
      should(botAuditPage.detectionText(html).jsonLd).containEql(
        'coordinates: 6.51234, 46.10222'
      );
      should(verdicts(html).jsonLd.matched).be.true();
    });

    it('does not join the fields of a JSON-LD block into one text', () => {
      const html = page({
        jsonLd:
          '{"name":"utmà","city":"0.1","county":"aà","region":"10000 aa"}',
      });
      const { jsonLd } = botAuditPage.detectionText(html);
      should(jsonLd.split('\n')).eql([
        'name: utmà',
        'city: 0.1',
        'county: aà',
        'region: 10000 aa',
      ]);
      should(verdicts(html).jsonLd.matched).be.false();
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
      should(botAuditPage.recordRefs(html, BASE)).eql({
        cave: [9, 12],
        massif: [3],
        organization: [8],
        entrance: [77],
        foreign: 0,
      });
    });

    it('reads only what the generator emits: hrefs and JSON-LD ids on the SPA address, not the text of a description', () => {
      const html = page({
        body: '<a href="https://grottocenter.org/ui/caves/12">kept</a><p>See https://grottocenter.org/ui/caves/77 and /caves/78 and <a href="https://some-club.fr/caves/79">a club</a> and <a href="https://grottocenter.org/api/caves/80">api</a>, also /ui/massifs/81</p>',
        jsonLd:
          '{"@id":"https://grottocenter.org/ui/caves/9","name":"https://grottocenter.org/ui/caves/82","description":"/ui/massifs/83"}',
      });
      should(botAuditPage.recordRefs(html, BASE)).eql({
        cave: [9, 12],
        massif: [],
        organization: [],
        entrance: [],
        foreign: 0,
      });
    });

    it('accepts the relative address of the SPA and a trailing slash, query or fragment', () => {
      const html = page({
        body: '<a href="/ui/caves/5">a</a><a href="/ui/massifs/6/">b</a><a href="https://grottocenter.org/ui/organizations/7?x=1">c</a><a href="/ui/entrances/8#top">d</a><a href="/other/caves/9">e</a>',
      });
      should(botAuditPage.recordRefs(html, BASE)).eql({
        cave: [5],
        massif: [6],
        organization: [7],
        entrance: [8],
        foreign: 0,
      });
    });

    it('reads hrefs written with single quotes, without quotes, and with entities', () => {
      const html = page({
        body: '<a href=\'/ui/caves/1\'>a</a><a href=/ui/caves/2>b</a><a href="https://grottocenter.org/ui/caves/3?a=1&amp;b=2">c</a>',
      });
      should(botAuditPage.recordRefs(html, BASE).cave).eql([1, 2, 3]);
    });

    it('matches a reference on its path, whatever the host, and counts the ones on another origin: a base URL that changed does not blind the check', () => {
      const html = page({
        body: '<a href="https://grottocenter.org/ui/caves/1">same</a><a href="https://www.grottocenter.org/ui/caves/2">www</a><a href="http://grottocenter.org/ui/massifs/3">http</a><a href="https://old.example.org/ui/organizations/4">old host</a><a href="/ui/entrances/5">relative</a>',
        jsonLd: '{"@id":"https://old.example.org/ui/caves/6"}',
      });
      should(botAuditPage.recordRefs(html, BASE)).eql({
        cave: [1, 2, 6],
        massif: [3],
        organization: [4],
        entrance: [5],
        foreign: 4,
      });
    });

    it("does not match a path that is not the SPA's, on any host", () => {
      const html = page({
        body: '<a href="https://some-club.fr/caves/79">club</a><a href="https://grottocenter.org/api/caves/80">api</a><a href="https://some-club.fr/ui/countries/FR">hub</a><a href="mailto:a@b.fr">mail</a><a href="javascript:void(0)">js</a>',
      });
      should(botAuditPage.recordRefs(html, BASE)).eql({
        cave: [],
        massif: [],
        organization: [],
        entrance: [],
        foreign: 0,
      });
    });

    it('reads an href that follows an attribute value holding a raw >, in either quote style', () => {
      const html = page({
        body: `<a title="a > b" href="/ui/caves/5">a</a><a data-x='x > y' href='/ui/massifs/6'>b</a><a title="it's > ok" rel="noopener" href="/ui/organizations/7">c</a>`,
      });
      should(botAuditPage.recordRefs(html, BASE)).eql({
        cave: [5],
        massif: [6],
        organization: [7],
        entrance: [],
        foreign: 0,
      });
    });

    it('reads the hrefs of a tag with an unbalanced quote in an unquoted value, which a browser accepts', () => {
      // The apostrophe in `don't` opens a quote no `'` closes
      const alone = page({
        body: `<a title=don't href="/ui/caves/5">a</a>`,
      });
      should(botAuditPage.recordRefs(alone, BASE).cave).eql([5]);

      // And with a later `'`, which would swallow the tags up to it
      const swallowing = page({
        body: `<a title=don't href="/ui/caves/6">a</a><a href="/ui/massifs/7">b</a><a href="/ui/organizations/8">c</a><p>it's</p>`,
      });
      const refs = botAuditPage.recordRefs(swallowing, BASE);
      should(refs.cave).eql([6]);
      should(refs.massif).eql([7]);
      should(refs.organization).eql([8]);
    });

    it('reads a tag that has both an unbalanced quote and a raw > in a later quoted value', () => {
      const tag = `<a title=don't data-x="a > b" href="/ui/entrances/12">x</a>`;
      should(botAuditPage.recordRefs(page({ body: tag }), BASE).entrance).eql([
        12,
      ]);

      // Followed by a link a contributor typed and by a later quote: the span
      // the quoted scan swallows must not hide the href of the first tag
      const swallowing = page({
        body: `${tag}<a href="/ui/caves/3" rel="nofollow ugc">w</a><p>it's</p>`,
      });
      const refs = botAuditPage.recordRefs(swallowing, BASE);
      should(refs.entrance).eql([12]);
      // The typed link is still skipped
      should(refs.cave).eql([]);
    });

    it('reports markup that cannot be read: a tag, a comment, a script or a style still open at the end of the page, a bogus comment', () => {
      [
        '<a href="/ui/caves/1"',
        '<a href="/ui/caves/1',
        '<p>text<!-- never closed',
        '<script>{"a":1}',
        '<style>a{color:red}',
        '<a title="x > y" href=/ui/caves/1',
        '</p',
        '<!DOCTYPE html',
        '<!x> <a href="/ui/caves/1">',
        '<?php echo 1 ?>',
        '</ ><a href="/ui/caves/1">',
        '<!-',
      ].forEach((html) =>
        should(botAuditPage.scan(html).unreadable).equal(true, html)
      );
      [
        '<a href="/ui/caves/1">x</a>',
        '<script>{"a":1}</script>',
        '<script>{"a":1}</SCRIPT\t\n bar>',
        '<style>a{}</style foo>',
        '<p>1 < 2 and a<3</p>',
        '<!-- c -->',
        '<!DOCTYPE html><html></html>',
        '<!doctype html>',
        '</p title=">">',
      ].forEach((html) =>
        should(botAuditPage.scan(html).unreadable).equal(false, html)
      );
    });

    it('reads a script and a style as raw text up to their end tag, in any case', () => {
      const html =
        '<p>a</p><SCRIPT type="application/ld+json">{"x":"<a href=/ui/caves/7>"}</Script ><STYLE>b{}</STYLE><a href="/ui/caves/8">k</a>';
      const scanned = botAuditPage.scan(html);
      should(scanned.scripts).eql(['{"x":"<a href=/ui/caves/7>"}']);
      // The `<a href=/ui/caves/7>` inside the script is text, not a link
      should(scanned.hrefs).eql(['/ui/caves/8']);
    });

    it('takes the first occurrence of an attribute, as a browser does', () => {
      const html = page({
        body: '<a href="/ui/caves/5" href="/ui/caves/6">a</a>',
      });
      should(botAuditPage.recordRefs(html, BASE).cave).eql([5]);
    });

    it('reads a page that is not well formed in linear time: many tag starts with no end, quotes that never close, unclosed scripts, styles and comments', () => {
      // In a child process with a timeout: a scan that goes quadratic (or a
      // regex that backtracks) would hold the whole run, and nothing in this
      // process could interrupt it
      const script = `
        const botAuditPage = require(${JSON.stringify(
          path.join(__dirname, '../../../api/utils/botAuditPage')
        )});
        const units = [
          '<a ="a"', '<a href="x', "<a href='x", '<', '<a', '<a =', '<a "="',
          '<script>', '<style>', '<!--', '<!', '</', '<a title=don\\'t ',
          '<script type="application/ld+json">{', ' =  "a" =\\'b',
        ];
        const started = Date.now();
        units.forEach((unit) => {
          const html = unit.repeat(40000);
          botAuditPage.recordRefs(html, 'https://grottocenter.org/ui');
          botAuditPage.detectionText(html);
        });
        console.log(Date.now() - started);
      `;
      const result = childProcess.spawnSync(process.execPath, ['-e', script], {
        timeout: 20000,
        encoding: 'utf8',
      });
      should(result.error).be.undefined();
      should(result.status).equal(0);
      // 15 units of about 300 KB each: linear takes about 0.4 s in all
      should(Number(result.stdout)).be.below(2500);
    });

    it("does not read an href that is only text inside another attribute's value, as a browser does not", () => {
      const html = page({
        body: '<div title="a href=/ui/caves/8 > b"><a href="/ui/caves/9">k</a></div>',
      });
      should(botAuditPage.recordRefs(html, BASE).cave).eql([9]);
    });

    it('does not take an attribute of another tag for an href, and ignores a tag with no href', () => {
      const html = page({
        body: '<div title="/ui/caves/8"><span>x</span></div><img src="/ui/caves/9"><a href="/ui/caves/10">k</a>',
      });
      should(botAuditPage.recordRefs(html, BASE).cave).eql([10]);
    });

    it('skips the links a contributor typed, marked rel="nofollow ugc": the website of an organization', () => {
      const html = page({
        body: '<a href="https://grottocenter.org/ui/organizations/9">own</a><a href="https://grottocenter.org/ui/caves/12" rel="nofollow ugc">website</a><a rel="ugc nofollow" href="/ui/caves/13">other order</a><a href="/ui/caves/14" rel="noopener">not ugc</a>',
      });
      should(botAuditPage.recordRefs(html, BASE)).eql({
        cave: [14],
        massif: [],
        organization: [9],
        entrance: [],
        foreign: 0,
      });
    });

    it('reads the snapshot pages: the cave and the massif of the cave page', () => {
      const html = fs.readFileSync(path.join(SNAPSHOTS, 'cave.html'), 'utf8');
      should(botAuditPage.recordRefs(html, 'https://example.test/ui')).eql({
        cave: [12],
        massif: [3],
        organization: [],
        entrance: [],
        foreign: 0,
      });
    });

    it('ignores what is not a record: hubs, ids with a leading zero, over 10 digits or past the integer range', () => {
      const html = page({
        body: '<a href="/ui/countries/FR">f</a><a href="/ui/caves/012">z</a><a href="/ui/caves/99999999999">big</a><a href="/ui/caves/2147483648">over</a><a href="/ui/caves/0">zero</a>',
      });
      should(botAuditPage.recordRefs(html, BASE)).eql({
        cave: [],
        massif: [],
        organization: [],
        entrance: [],
        foreign: 0,
      });
    });
  });
});
