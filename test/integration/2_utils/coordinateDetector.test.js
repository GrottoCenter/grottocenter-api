const should = require('should');
const {
  detect,
  PATTERN_SET_VERSION,
  PATTERN_SET_FINGERPRINT,
  PATTERN_IDS,
} = require('../../../api/utils/coordinateDetector');

// Fingerprint of the pattern set for each version that has shipped. The stored
// verdicts of every text are tied to a version, so changing a pattern without
// moving to a new version would leave old verdicts looking current.
//
// When this suite fails because the fingerprint no longer matches:
//   1. bump PATTERN_SET_VERSION in api/utils/coordinateDetector.js,
//   2. add the new version with the new fingerprint below, and keep the old entry.
const RECORDED_FINGERPRINTS = {
  1: '0792176c4fbbedfc8421cde4662d5a669c991ac9c477156fccebff46718109a9',
};

describe('coordinateDetector - pattern set version', () => {
  it('is a positive integer', () => {
    should(Number.isInteger(PATTERN_SET_VERSION)).be.true();
    should(PATTERN_SET_VERSION).be.above(0);
  });

  it('has a recorded fingerprint for the current version', () => {
    should(RECORDED_FINGERPRINTS).have.property(String(PATTERN_SET_VERSION));
  });

  it('keeps every earlier recorded version below the current one', () => {
    Object.keys(RECORDED_FINGERPRINTS).forEach((v) => {
      should(Number(v)).be.belowOrEqual(PATTERN_SET_VERSION);
    });
  });

  it('matches the recorded fingerprint, so a changed pattern needs a new version', () => {
    should(PATTERN_SET_FINGERPRINT).equal(
      RECORDED_FINGERPRINTS[PATTERN_SET_VERSION]
    );
  });

  it('names every family with a unique identifier', () => {
    should(new Set(PATTERN_IDS).size).equal(PATTERN_IDS.length);
    should(PATTERN_IDS).deepEqual([
      'dms',
      'degrees-hemisphere',
      'decimal-pair',
      'lambert-xy',
      'lambert-label',
      'utm',
      'ngr',
      'labelled-coordinates',
      'labelled-axis',
    ]);
  });
});

describe('coordinateDetector - named regression cases', () => {
  it('flags the Lambert II note of entrance 1', () => {
    const result = detect(
      'Coordonnées Lambert II Centre (km) : X= 943,37 Y= 132,12 Z=1840 (entrée V4)'
    );
    should(result.matched).be.true();
    should(result.patternId).equal('lambert-xy');
    should(result.match).equal('X= 943,37 Y= 132,12');
  });

  it('flags decimal degrees with hemisphere letters and no comma between the two numbers', () => {
    // A first detector without this family let the text through.
    const result = detect(
      'the most southerly entrance is currently North by North End Pot (54.183628°N 2.487239°W, NGR SD 6830 7654) on the'
    );
    should(result.matched).be.true();
    should(result.patternId).equal('degrees-hemisphere');
  });

  it('flags a British National Grid reference on its own', () => {
    should(detect('the map reference NGR SD 6830 7654')).have.property(
      'patternId',
      'ngr'
    );
  });
});

describe('coordinateDetector - families', () => {
  // [family, label, text]. French and English labels, with "." and "," as decimal separator.
  const positives = [
    [
      'dms',
      'degrees minutes seconds with hemisphere',
      '46°06\'08"N 6°30\'36"E',
    ],
    ['dms', 'spaces and doubled quotes', "46° 06' 08'' N"],
    ['dms', 'hemisphere letter first', 'N46°06\'08"'],
    ['dms', 'decimal minutes', "46°06.133' N"],
    ['dms', 'prime character', '45°30′N'],
    ['dms', 'French label', 'localisation 46°06\'08" Nord, 6°30\'36" Est'],
    [
      'degrees-hemisphere',
      'decimal degrees with a hemisphere letter',
      '54.183628°N 2.487239°W',
    ],
    ['degrees-hemisphere', 'whole degrees', '46° N, 6° E'],
    ['degrees-hemisphere', 'after a word ending in s', 'puits 0.1°N'],
    ['degrees-hemisphere', 'after a word ending in n', 'entrée en 46.10222°N'],
    ['degrees-hemisphere', 'comma decimal separator', '46,10222 N 6,51 E'],
    ['decimal-pair', 'point decimals', '46.10222, 6.51'],
    ['decimal-pair', 'comma decimals and semicolon', '46,10222 ; 6,51'],
    ['decimal-pair', 'space only, three decimals', '46.102 6.510'],
    ['decimal-pair', 'negative values', '-34.4512 -85.1234'],
    ['decimal-pair', 'slash separator', '46.10222/6.51'],
    ['lambert-xy', 'French kilometres', 'X= 943,37 Y= 132,12'],
    ['lambert-xy', 'lowercase and points', 'x=943.37 y=132.12'],
    ['lambert-xy', 'metres with colons', 'X : 943370 Y : 2132120'],
    [
      'lambert-xy',
      'with other text between',
      'X = 943,37 km ; altitude 1840 ; Y = 132,12 km',
    ],
    ['lambert-label', 'Lambert II extended', 'Lambert II étendu'],
    ['lambert-label', 'Lambert 93', 'projection Lambert 93'],
    ['lambert-label', 'lowercase', 'lambert iii'],
    ['utm', 'zone, band, easting and northing', '32T 340000 5105000'],
    ['utm', 'spaced band', '31 T 123456 4567890'],
    ['utm', 'UTM label, Spanish', 'Coordenadas: UTM 30T 123456 - 4567890'],
    ['utm', 'UTM label without a band', 'UTM 32 340000 5105000'],
    ['ngr', 'letters and two groups', 'SD 6830 7654'],
    ['ngr', 'no spaces', 'SD683765'],
    ['ngr', 'six figures', 'TL 123 456'],
    ['labelled-coordinates', 'French label', 'Coordonnées : 46.1'],
    ['labelled-coordinates', 'English label', 'Latitude 46.1'],
    ['labelled-coordinates', 'longitude with colon', 'longitude: 6.51'],
    ['labelled-coordinates', 'GPS', 'GPS: 46'],
    ['labelled-coordinates', 'abbreviation', 'Lat = 46, Lon = 6'],
    ['labelled-axis', 'French north', 'Nord : 4510.123'],
    ['labelled-axis', 'capitalised east', 'Est: 340000'],
    ['labelled-axis', 'English east', 'East = 340000'],
  ];

  positives.forEach(([family, label, text]) => {
    it(`flags ${family}: ${label}`, () => {
      const result = detect(text);
      should(result.matched).be.true();
      should(result.patternId).equal(family);
    });
  });

  it('covers every family with at least one positive case', () => {
    const covered = new Set(positives.map(([family]) => family));
    PATTERN_IDS.forEach((id) => should(covered.has(id)).be.true());
  });
});

describe('coordinateDetector - ordinary text', () => {
  const negatives = [
    'Profondeur 120 m, développement 3,5 km',
    'température de 8,5 °C',
    'pente de 45°',
    'découvert en 1963',
    'Altitude 1800 mètres',
    'explorée le 25.4.2004 par le groupe',
    'cote -938 mètres au siphon',
    '2 à 3 mètres de largeur, 14 entrées',
    'Gouffre Jean-Bernard (V4)',
    '1 250 mètres de galeries',
    '12.5 km au nord du village',
    'le collecteur coule vers le nord',
    'la salle est = 25x30x10 m',
    'la galerie est : 120 m',
    'La grotte Lambert 2 est proche',
    'orientée N120°E puis S 30° W',
    'Aven N 45° E',

    'altitude 0,50111 de hauteur',
    'The cave is 1.5 km long and 85 m deep, with a stream passage.',
    'Cette cavité de 85 m de profondeur se développe sur 1 200 m, la rivière souterraine ressort à 640 m d’altitude.',
    'La grotta è lunga 350 m, la temperatura è di 9,5 °C.',
  ];

  negatives.forEach((text) => {
    it(`does not flag: ${text.slice(0, 50)}`, () => {
      should(detect(text)).deepEqual({ matched: false });
    });
  });

  // Conservative on purpose: a false positive only withholds one text until it
  // is edited, a false negative publishes a position. These pin the choice.
  describe('documented conservative matches', () => {
    it('flags a dip written in degrees and minutes', () => {
      should(detect("pendage de 45° 30'")).have.property('patternId', 'dms');
    });

    it('flags a mention of the Lambert system without numbers', () => {
      should(detect('dans le repère Lambert III (IGN)')).have.property(
        'patternId',
        'lambert-label'
      );
    });

    it('flags two measurements with three decimals', () => {
      should(detect('mesures 1.250 1.300')).have.property(
        'patternId',
        'decimal-pair'
      );
    });
  });
});

describe('coordinateDetector - input', () => {
  it('treats null, undefined and the empty string as no match', () => {
    [null, undefined, '', '   '].forEach((value) => {
      should(detect(value)).deepEqual({ matched: false });
    });
  });

  it('throws a TypeError for anything that is not a string, so a caller can fail closed', () => {
    [42, {}, [], true, () => {}].forEach((value) => {
      should(() => detect(value)).throw(TypeError);
    });
  });

  it('returns the matched text, capped at 80 characters', () => {
    const long = `X=${'9'.repeat(7)} ${'a'.repeat(50)} Y=${'9'.repeat(7)}`;
    const { match } = detect(long);
    should(match.length).be.belowOrEqual(80);
    should(match.startsWith('X=9999999')).be.true();
  });

  it('reads full-width digits, non-breaking and narrow spaces like their plain forms', () => {
    should(detect('X= \uff19\uff14\uff13,37 Y= 132,12')).have.property(
      'matched',
      true
    );
    should(detect('32T\u00a0340000\u00a05105000')).have.property(
      'patternId',
      'utm'
    );
    should(detect('32T\u202f340000\u202f5105000')).have.property(
      'patternId',
      'utm'
    );
  });

  it('returns the same result for the same text, whatever was scanned before', () => {
    const text = 'GPS: 46.1';
    const first = detect(text);
    detect('X= 943,37 Y= 132,12');
    detect('plain text');
    should(detect(text)).deepEqual(first);
  });

  it('returns a frozen result for a text without coordinates, so no caller can alter it', () => {
    should(Object.isFrozen(detect('plain text'))).be.true();
    should(detect('other plain text')).deepEqual({ matched: false });
  });
});

describe('coordinateDetector - hostile input', () => {
  // Long inputs built to make a careless pattern backtrack. A regression
  // here takes minutes, so the generous suite timeout is the assertion.
  const hostile = {
    'long run of spaces then a digit': `${' '.repeat(100000)}1`,
    'digits and spaces alternating': '1 '.repeat(50000),
    'one huge number': '9'.repeat(100000),
    'repeated X= labels': 'X='.repeat(30000),
    'decimal with a very long fraction': `46.${'1'.repeat(50000)}`,
    'spaces before a degree sign': `1${' '.repeat(50000)}°`,
    'repeated Lambert words': 'lambert '.repeat(10000),
    'repeated UTM words': 'UTM '.repeat(20000),
    'repeated hemisphere letters': 'N '.repeat(30000),
    'repeated grid letters and digits': 'SD 12 '.repeat(20000),
    'repeated label without number': 'Coordonnées '.repeat(10000),
  };

  Object.entries(hostile).forEach(([label, text]) => {
    it(`finishes on ${label}`, () => {
      const result = detect(text);
      should(result).have.property('matched');
    });
  });
}).timeout(30000);
