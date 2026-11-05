const fs = require('fs');
const path = require('path');
const should = require('should');
const fc = require('fast-check');
const {
  cleanRegionName,
  sortKey,
  byName,
  figureLines,
  pluralText,
  capitalize,
  buildTitle,
} = require('../../../api/utils/botModelParts');

const { labelsFor, languageOfLabels } = require('../../../api/utils/botLabels');

const ROOT = path.join(__dirname, '../../..');

describe('botModelParts', () => {
  describe('cleanRegionName', () => {
    it('removes the [bracketed alternatives] and the trailing asterisk: GB-CMN and ES-NA', () => {
      should(cleanRegionName('Carmarthenshire [Sir Gaerfyrddin GB-GFY]')).equal(
        'Carmarthenshire'
      );
      should(cleanRegionName('Nafarroa*')).equal('Nafarroa');
    });

    it('handles every shape of name the table holds', () => {
      [
        ['Ain', 'Ain'],
        ['Nafarroako Foru Komunitatea*', 'Nafarroako Foru Komunitatea'],
        ['Cork [Corcaigh]', 'Cork'],
        ['A [x] B [y]', 'A B'],
        ['Ceredigion [Sir Ceredigion] *', 'Ceredigion'],
        ['  Padded  ', 'Padded'],
        ['Isle of Anglesey [Sir Ynys Môn GB-YNM]', 'Isle of Anglesey'],
        ['Star * inside', 'Star * inside'],
      ].forEach(([raw, expected]) =>
        should(cleanRegionName(raw)).equal(expected, raw)
      );
    });

    it('is null when nothing is left, or when it is not a string', () => {
      ['[Only]', '*', '', '   ', null, undefined, 12].forEach((raw) =>
        should(cleanRegionName(raw)).be.null()
      );
    });

    it('never leaves a bracket pair or a trailing asterisk, and is idempotent', () => {
      fc.assert(
        fc.property(fc.string({ maxLength: 40 }), (raw) => {
          const cleaned = cleanRegionName(raw);
          if (cleaned === null) return;
          should(cleaned).not.match(/\[[^\]]*\]/);
          should(cleaned).not.match(/\*$/);
          should(cleaned).equal(cleaned.trim());
          should(cleanRegionName(cleaned)).equal(cleaned);
        }),
        { numRuns: 500 }
      );
    });
  });

  describe('sortKey and byName', () => {
    it('sorts ignoring accents and case, then by code point', () => {
      const names = [
        'Zambia',
        'España',
        'Émirats arabes unis',
        'albania',
        'France',
        'Ecuador',
      ].map((text) => ({ text }));
      should(names.sort(byName).map((n) => n.text)).deepEqual([
        'albania',
        'Ecuador',
        'Émirats arabes unis',
        'España',
        'France',
        'Zambia',
      ]);
    });

    it('is a total order that does not depend on the input order', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ maxLength: 8 }), { maxLength: 12 }),
          (texts) => {
            const forward = texts.map((text) => ({ text })).sort(byName);
            const backward = [...texts]
              .reverse()
              .map((text) => ({ text }))
              .sort(byName);
            should(forward).deepEqual(backward);
          }
        )
      );
      should(sortKey('Ñandú')).equal('nandu');
    });
  });

  describe('figureLines', () => {
    const labels = {
      figureCaves: '{count, plural, one {cave} other {caves}}',
      figureNetworks: '{count, plural, one {network} other {networks}}',
      figureMassif: 'massif',
      figureMassifs: 'massifs',
      figureDivingCaves:
        '{count, plural, one {cave is diveable} other {caves are diveable}}',
      figureTotalLength: 'cumulated length',
      avgDepth: 'avg depth',
      avgLength: 'avg length',
    };

    it('words each figure as the SPA does: the number, then its text, in a fixed order', () => {
      should(
        figureLines(
          {
            avgLength: 5,
            avgDepth: 4,
            totalLength: 3,
            nbDivingCaves: 2,
            nbMassifs: 3,
            nbNetworks: 1,
            nbCaves: 7,
          },
          labels
        )
      ).deepEqual([
        { value: '7', text: 'caves' },
        { value: '1', text: 'network' },
        { value: '3', text: 'massifs' },
        { value: '2', text: 'caves are diveable' },
        { value: '3 m', text: 'cumulated length' },
        { value: '4 m', text: 'avg depth' },
        { value: '5 m', text: 'avg length' },
      ]);
    });

    it('uses the singular for 0 or 1 massif and the plural above, as the SPA does', () => {
      const massifs = (nbMassifs) =>
        figureLines({ nbCaves: 1, nbMassifs }, labels).find(
          (line) => line.value === String(nbMassifs) && /massif/.test(line.text)
        ).text;
      should(massifs(0)).equal('massif');
      should(massifs(1)).equal('massif');
      should(massifs(2)).equal('massifs');
    });

    it('leaves out a figure that is null or missing, and keeps a count of 0', () => {
      should(
        figureLines({ nbCaves: 3, nbNetworks: 0, totalLength: null }, labels)
      ).deepEqual([
        { value: '3', text: 'caves' },
        { value: '0', text: 'networks' },
      ]);
    });

    it('prints nothing when the statistics count no cave: the view is stale, not the hub empty', () => {
      should(figureLines({ nbCaves: 0, nbNetworks: 0 }, labels)).deepEqual([]);
      should(figureLines(null, labels)).deepEqual([]);
      should(figureLines(undefined, labels)).deepEqual([]);
    });
  });

  describe('pluralText', () => {
    const message = '{count, plural, one {cavité} other {cavités}}';

    it('picks the branch of the plural rules of the language', () => {
      should(pluralText(message, 1, 'fr')).equal('cavité');
      should(pluralText(message, 0, 'fr')).equal('cavité'); // French: 0 is "one"
      should(pluralText(message, 0, 'en')).equal('cavités');
      should(pluralText(message, 2, 'fr')).equal('cavités');
      should(pluralText(message, 1000, 'fr')).equal('cavités');
    });

    it('prefers an exact =n branch, falls back to other, and replaces #', () => {
      const exact = '{count, plural, =0 {none} one {# cave} other {# caves}}';
      should(pluralText(exact, 0, 'en')).equal('none');
      should(pluralText(exact, 1, 'en')).equal('1 cave');
      should(pluralText(exact, 7, 'en')).equal('7 caves');
      // Arabic has a "few" category this message lacks: "other"
      should(pluralText('{count, plural, one {a} other {b}}', 3, 'ar')).equal(
        'b'
      );
    });

    it('keeps a plain label, and one that is not a plural message, as it is', () => {
      should(pluralText('tauchbare Höhlen', 8, 'de')).equal('tauchbare Höhlen');
      should(pluralText('{count} caves', 8, 'en')).equal('{count} caves');
    });

    it('resolves every plural label of the 15 generated label files', () => {
      const dir = path.join(ROOT, 'api/utils/botLabels');
      fs.readdirSync(dir)
        .filter((file) => /^[a-z]{2}\.json$/.test(file))
        .forEach((file) => {
          const lang = file.slice(0, 2);
          const labels15 = JSON.parse(fs.readFileSync(path.join(dir, file)));
          // Any label with a brace, not only the ones in the expected form: a
          // regenerated string in another ICU shape must not reach a page raw
          Object.values(labels15)
            .filter((text) => text.includes('{') || text.includes('}'))
            .forEach((text) =>
              [0, 1, 2, 5, 21].forEach((n) =>
                should(pluralText(text, n, lang)).not.match(/[{}]/)
              )
            );
        });
    });
  });

  describe('the plural rules of the labels, not of the page', () => {
    it('gives a Russian page, whose labels are English, the English plural: 21 caves', () => {
      const lines = figureLines(
        { nbCaves: 21, nbNetworks: 31 },
        labelsFor('ru')
      );
      should(lines[0]).deepEqual({
        value: '21',
        text: 'caves (1 or multiple entrances)',
      });
      should(lines[1].text).startWith('networks');
      // Russian rules would have taken "one" for 21
      should(new Intl.PluralRules('ru').select(21)).equal('one');
    });

    it('takes the language from the labels themselves', () => {
      should(languageOfLabels(labelsFor('fr'))).equal('fr');
      should(languageOfLabels(labelsFor('he'))).equal('he');
    });

    it('falls back to English for a language the front does not translate, and for labels it did not hand out', () => {
      should(languageOfLabels(labelsFor('pl'))).equal('en');
      should(languageOfLabels(labelsFor('ru'))).equal('en');
      should(languageOfLabels({ figureCaves: 'x' })).equal('en');
    });
  });

  describe('capitalize', () => {
    it('upper-cases the first letter only, and leaves an empty or missing text', () => {
      should(capitalize('cavités')).equal('Cavités');
      should(capitalize('caves')).equal('Caves');
      should(capitalize('洞窟')).equal('洞窟');
      should(capitalize('')).equal('');
      should(capitalize(null)).equal(null);
    });
  });

  describe('buildTitle', () => {
    it('keeps the title rules the cave pages use', () => {
      should(buildTitle('Berger')).equal('Berger - Grottocenter');
      should(buildTitle('')).equal('Grottocenter');
    });
  });
});

describe('the hubs and the translated region names (#1937)', () => {
  // The name_<lang> columns of t_iso3166_2 are being dropped: nothing the hubs
  // read or render may name one, so the drop can ship in either order
  const files = [
    'sql/9_30_2026_10_29_v_bot_page.sql',
    'sql/9_31_2026_10_30_v_bot_page_massifs_organizations.sql',
    'sql/9_34_2026_11_04_v_bot_hub.sql',
    'api/services/bot/BotHubService.js',
    'api/services/bot/BotRenderService.js',
    'api/services/bot/BotPageGeneratorService.js',
    'api/utils/botHubModel.js',
    'api/utils/botModelParts.js',
    'api/utils/botPageModel.js',
    'api/utils/botJsonLd.js',
    'api/utils/botSurfaceWhitelist.js',
    ...fs
      .readdirSync(path.join(ROOT, 'views/bot'))
      .map((name) => `views/bot/${name}`),
  ];
  const LANGS = 'ar|bg|ca|de|el|en|es|fr|he|id|it|ja|nl|pt|ro|zh|ru|pl|sv|fi';
  const SNAKE = new RegExp(`\\bname_(?:${LANGS})\\b`, 'i');
  const CAMEL = new RegExp(
    `\\bname(?:${LANGS.split('|')
      .map((l) => l[0].toUpperCase() + l.slice(1))
      .join('|')})\\b`
  );

  it('no SQL, service, model or template of the bot surface names a name_<lang> column or attribute', () => {
    files.forEach((file) => {
      const source = fs.readFileSync(path.join(ROOT, file), 'utf8');
      should(source).not.match(SNAKE, `${file} names a name_<lang> column`);
      should(source).not.match(CAMEL, `${file} names a translated attribute`);
    });
    // The check does bite: the model of the table has them
    const model = fs.readFileSync(
      path.join(ROOT, 'api/models/TISO31662.js'),
      'utf8'
    );
    should(model).match(CAMEL);
    should(model).match(SNAKE);
  });

  it('reads the region name from t_iso3166_2.name, by the code of the entrance or of the hub', () => {
    const hub = fs.readFileSync(
      path.join(ROOT, 'sql/9_34_2026_11_04_v_bot_hub.sql'),
      'utf8'
    );
    should(hub).match(/iso\.name/);
    should(hub).match(/FROM t_iso3166_2 iso/);
  });
});
