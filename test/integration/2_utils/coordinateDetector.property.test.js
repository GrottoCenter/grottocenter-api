const should = require('should');
const fc = require('fast-check');
const {
  detect,
  PATTERN_IDS,
} = require('../../../api/utils/coordinateDetector');

const pad2 = (n) => String(n).padStart(2, '0');

// Prose without digits and without any word the patterns look for as a label
// (no "lambert", "gps", "latitude", "coordonnées", "nord", "est", ...).
const WORDS = [
  'grotte',
  'aven',
  'cave',
  'puits',
  'salle',
  'galerie',
  'siphon',
  'rivière',
  'profondeur',
  'développement',
  'entrée',
  'explorée',
  'description',
  'passage',
  'étroit',
  'large',
  'the',
  'and',
  'le',
  'la',
  'de',
  'du',
  'des',
  'avec',
  'une',
];
const PUNCTUATION = ['.', ',', ';', ':', '(', ')', '-', '\n'];

const prose = fc
  .array(fc.constantFrom(...WORDS, ...PUNCTUATION), { maxLength: 12 })
  .map((tokens) => tokens.join(' '));

const decimalSeparator = fc.constantFrom('.', ',');
const hemisphere = fc.constantFrom('N', 'S', 'E', 'W', 'O');

// One arbitrary per family. Each builds a fragment from random numbers, so a
// wrong implementation cannot pass by memorising a few examples.
const FRAGMENTS = {
  dms: fc
    .record({
      deg: fc.integer({ min: 0, max: 179 }),
      min: fc.integer({ min: 0, max: 59 }),
      sec: fc.integer({ min: 0, max: 59 }),
      quote: fc.constantFrom('"', "''", '′′', '”'),
      hemi: hemisphere,
    })
    .map(
      ({ deg, min, sec, quote, hemi }) =>
        `${deg}°${pad2(min)}'${pad2(sec)}${quote}${hemi}`
    ),

  'degrees-hemisphere': fc
    .record({
      deg: fc.integer({ min: 0, max: 179 }),
      frac: fc.integer({ min: 1, max: 99999999 }),
      sep: decimalSeparator,
      hemi: hemisphere,
    })
    .map(({ deg, frac, sep, hemi }) => `${deg}${sep}${frac}°${hemi}`),

  'decimal-pair': fc
    .record({
      lat: fc.integer({ min: 0, max: 89 }),
      latFrac: fc.integer({ min: 1000, max: 99999999 }),
      lon: fc.integer({ min: 0, max: 179 }),
      lonFrac: fc.integer({ min: 1, max: 99 }),
      sep: decimalSeparator,
      join: fc.constantFrom(', ', ' ; ', ' / ', ' '),
    })
    .map(
      ({ lat, latFrac, lon, lonFrac, sep, join }) =>
        `${lat}${sep}${latFrac}${join}${lon}${sep}${lonFrac}`
    ),

  'lambert-xy': fc
    .record({
      x: fc.integer({ min: 100, max: 999 }),
      xFrac: fc.integer({ min: 0, max: 99 }),
      y: fc.integer({ min: 100, max: 999 }),
      yFrac: fc.integer({ min: 0, max: 99 }),
      sep: decimalSeparator,
      label: fc.constantFrom(['X= ', 'Y= '], ['x=', 'y='], ['X : ', 'Y : ']),
    })
    .map(
      ({ x, xFrac, y, yFrac, sep, label }) =>
        `${label[0]}${x}${sep}${pad2(xFrac)} ${label[1]}${y}${sep}${pad2(yFrac)}`
    ),

  utm: fc
    .record({
      zone: fc.integer({ min: 1, max: 60 }),
      band: fc.constantFrom(...'CDEFGHJKLMNPQRSTUVWX'),
      easting: fc.integer({ min: 100000, max: 999999 }),
      northing: fc.integer({ min: 1000000, max: 9999999 }),
    })
    .map(
      ({ zone, band, easting, northing }) =>
        `${zone}${band} ${easting} ${northing}`
    ),

  ngr: fc
    .record({
      first: fc.constantFrom(...'ABCDEFGHJKLMNOPQRSTUVWXYZ'),
      second: fc.constantFrom(...'ABCDEFGHJKLMNOPQRSTUVWXYZ'),
      east: fc.integer({ min: 1000, max: 9999 }),
      north: fc.integer({ min: 1000, max: 9999 }),
    })
    .map(
      ({ first, second, east, north }) => `${first}${second} ${east} ${north}`
    ),
};

describe('coordinateDetector - Property: every generated position is recognised as its family', () => {
  Object.entries(FRAGMENTS).forEach(([family, arbitrary]) => {
    it(`names ${family} for a fragment on its own`, () => {
      fc.assert(
        fc.property(arbitrary, (fragment) => {
          const result = detect(fragment);
          should(result.matched).be.true();
          should(result.patternId).equal(family);
        }),
        { numRuns: 200 }
      );
    });
  });

  it('covers every family the detector declares', () => {
    should(Object.keys(FRAGMENTS).sort()).deepEqual(
      PATTERN_IDS.filter((id) => FRAGMENTS[id]).sort()
    );
  });
});

describe('coordinateDetector - Property: a position cannot hide inside prose', () => {
  Object.entries(FRAGMENTS).forEach(([family, arbitrary]) => {
    it(`flags a ${family} fragment wherever it sits in digit-free prose`, () => {
      fc.assert(
        fc.property(prose, arbitrary, prose, (before, fragment, after) => {
          const result = detect(`${before} ${fragment} ${after}`);
          should(result.matched).be.true();
          should(PATTERN_IDS).containEql(result.patternId);
        }),
        { numRuns: 150 }
      );
    });
  });
});

describe('coordinateDetector - Property: decimal separator invariance', () => {
  ['decimal-pair', 'lambert-xy'].forEach((family) => {
    it(`flags ${family} with a comma wherever it flags it with a point`, () => {
      fc.assert(
        fc.property(FRAGMENTS[family], (fragment) => {
          // Swap only the decimal separator of each number, not the separators between them.
          const swapped = fragment.replace(/(\d)[.,](\d)/g, (_, a, b) =>
            fragment.includes(`${a}.${b}`) ? `${a},${b}` : `${a}.${b}`
          );
          should(detect(fragment).matched).be.true();
          should(detect(swapped).matched).be.true();
        }),
        { numRuns: 150 }
      );
    });
  });
});

describe('coordinateDetector - Property: ordinary text is left alone', () => {
  const unit = fc.constantFrom('m', 'km', 'mm', 'cm', '%', '°C', 'ans', 'h');
  const measure = fc
    .record({
      whole: fc.integer({ min: 0, max: 99999 }),
      frac: fc.option(fc.integer({ min: 0, max: 99 }), { nil: undefined }),
      sep: decimalSeparator,
      unit,
    })
    .map(
      ({ whole, frac, sep, unit: u }) =>
        `${whole}${frac === undefined ? '' : `${sep}${pad2(frac)}`} ${u}`
    );

  it('never flags prose without any digit', () => {
    fc.assert(
      fc.property(prose, (text) => {
        should(detect(text)).deepEqual({ matched: false });
      }),
      { numRuns: 200 }
    );
  });

  it('never flags prose with years and measurements of at most two decimals', () => {
    // Guards against a pattern so broad that it withholds every text with a number.
    fc.assert(
      fc.property(
        prose,
        fc.array(
          fc.oneof(measure, fc.integer({ min: 1000, max: 2100 }).map(String)),
          {
            minLength: 1,
            maxLength: 4,
          }
        ),
        prose,
        (before, numbers, after) => {
          should(detect(`${before} ${numbers.join(' ; ')} ${after}`)).deepEqual(
            {
              matched: false,
            }
          );
        }
      ),
      { numRuns: 200 }
    );
  });
});

describe('coordinateDetector - Property: any text gives a well-formed verdict', () => {
  const anyText = fc.oneof(
    fc.string({ maxLength: 300 }),
    fc.string({ unit: 'binary', maxLength: 300 }),
    fc.string({ unit: 'grapheme', maxLength: 300 })
  );

  it('never throws and returns either a plain miss or a hit that names a family and quotes the text', () => {
    fc.assert(
      fc.property(anyText, (text) => {
        const result = detect(text);
        if (!result.matched) {
          should(result).deepEqual({ matched: false });
          return;
        }
        should(PATTERN_IDS).containEql(result.patternId);
        should(result.match).be.a.String();
        should(result.match.length).be.within(1, 80);
        should(text.normalize('NFKC').includes(result.match)).be.true();
      }),
      { numRuns: 300 }
    );
  });

  it('gives the same verdict for the same text, whatever was scanned in between', () => {
    fc.assert(
      fc.property(anyText, anyText, (a, b) => {
        const first = detect(a);
        detect(b);
        should(detect(a)).deepEqual(first);
      }),
      { numRuns: 200 }
    );
  });
});
