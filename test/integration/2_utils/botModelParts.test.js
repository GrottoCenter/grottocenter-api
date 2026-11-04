const fs = require('fs');
const path = require('path');
const should = require('should');
const fc = require('fast-check');
const {
  cleanRegionName,
  sortKey,
  byName,
  figureFacts,
  buildTitle,
} = require('../../../api/utils/botModelParts');

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

  describe('figureFacts', () => {
    const labels = {
      cavesCount: 'caves',
      networks: 'networks',
      massifs: 'massifs',
      divingCave: 'diving',
      length: 'length',
      avgDepth: 'avg depth',
      avgLength: 'avg length',
    };

    it('lists the figures in a fixed order with their unit', () => {
      should(
        figureFacts(
          {
            avgLength: 5,
            avgDepth: 4,
            totalLength: 3,
            nbDivingCaves: 2,
            nbMassifs: 1,
            nbNetworks: 6,
            nbCaves: 7,
          },
          labels
        )
      ).deepEqual([
        { label: 'caves', value: '7' },
        { label: 'networks', value: '6' },
        { label: 'massifs', value: '1' },
        { label: 'diving', value: '2' },
        { label: 'length', value: '3 m' },
        { label: 'avg depth', value: '4 m' },
        { label: 'avg length', value: '5 m' },
      ]);
    });

    it('leaves out a figure that is null or missing, and keeps a count of 0', () => {
      should(
        figureFacts({ nbCaves: 3, nbNetworks: 0, totalLength: null }, labels)
      ).deepEqual([
        { label: 'caves', value: '3' },
        { label: 'networks', value: '0' },
      ]);
    });

    it('prints nothing when the statistics count no cave: the view is stale, not the hub empty', () => {
      should(figureFacts({ nbCaves: 0, nbNetworks: 0 }, labels)).deepEqual([]);
      should(figureFacts(null, labels)).deepEqual([]);
      should(figureFacts(undefined, labels)).deepEqual([]);
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
