const should = require('should');
const { project } = require('../../../api/utils/botSurfaceWhitelist');

// Sources shaped like what the page builder will read: every coordinate,
// protection flag and person is populated, so a leak cannot hide behind an
// empty value.
const entranceRow = (id) => ({
  id,
  name: `Entrée ${id}`,
  language: 'fra',
  city: 'Autrans',
  county: 'Isère',
  region: 'FR-38',
  country: 'FR',
  discoveryYear: 1963,
  dangerFlooding: false,
  dangerRockfall: true,
  dangerPollution: false,
  hasBat: true,
  needCleanGear: false,
  needStayOnTrail: false,
  hasRules: false,
  isTouristic: false,
  descriptions: [
    {
      title: 'Accès',
      body: 'Un puits de 20 m.',
      language: 'fra',
      author: { id: 5, nickname: 'jdoe', name: 'Jane', surname: 'Doe' },
    },
  ],
  latitude: 45.12345678,
  longitude: 5.54321,
  altitude: 1450,
  precision: 10,
  pointGeom: 'POINT(5.54321 45.12345678)',
  isSensitive: true,
  isSensitiveLocked: true,
  locations: [{ body: 'Lambert X= 943,37 Y= 132,12' }],
  comments: [{ body: 'Attention' }],
  riggings: [{ obstacles: ['P20'] }],
  histories: [{ body: 'edit' }],
  contact: 'jane@example.org',
  modalities: 'Clé au refuge',
  externalUrl: 'https://example.org',
  idDbImport: 'X1',
  nameDbImport: 'import',
});

const caveRow = () => ({
  id: 75262,
  name: 'Réseau des Écouges',
  language: 'fra',
  depth: 320,
  length: 0,
  temperature: 6,
  isDiving: false,
  lastmod: '2026-10-01',
  latitude: 45.1,
  longitude: 5.5,
  author: { id: 1, nickname: 'caver' },
  reviewer: { id: 2, nickname: 'rev' },
  isDeleted: false,
  redirectTo: null,
  descriptions: [{ title: 'Intro', body: 'Texte', language: 'fra' }],
  massifs: [{ id: 3, name: 'Vercors', geogPolygon: { type: 'Polygon' } }],
  entrances: Array.from({ length: 14 }, (_, i) => entranceRow(i + 1)),
});

const massifRow = () => ({
  id: 3,
  name: 'Vercors',
  language: 'fra',
  lastmod: '2026-10-01',
  geogPolygon: {
    type: 'Polygon',
    coordinates: [
      [
        [5.1, 45.1],
        [5.2, 45.2],
        [5.3, 45.1],
        [5.1, 45.1],
      ],
    ],
  },
  descriptions: [],
  caves: [
    {
      id: 75262,
      name: 'Réseau des Écouges',
      depth: 320,
      length: 0,
      latitude: 45.1,
    },
  ],
});

const documentRow = () => ({
  id: 9,
  title: 'Spelunca 12',
  type: 'Article',
  identifier: '1234-5678',
  identifierType: 'ISSN',
  datePublication: '1999-01-01',
  language: 'fra',
  lastmod: '2026-10-01',
  subjects: [{ id: 'AB', subject: 'Hydrology', parent: 'A' }],
  license: { name: 'CC-BY-SA', url: 'https://x', isCopyrighted: false },
  descriptions: [],
  organizationAuthors: [
    { id: 4, name: 'Spéléo Club', mail: 'club@example.org' },
  ],
  authors: [{ id: 6, nickname: 'jdoe', name: 'Jane', surname: 'Doe' }],
  files: [{ id: 1, fileName: 'scan.pdf' }],
});

const keysDeep = (value) => {
  if (Array.isArray(value)) return value.flatMap(keysDeep);
  if (value !== null && typeof value === 'object') {
    return Object.entries(value).flatMap(([k, v]) => [k, ...keysDeep(v)]);
  }
  return [];
};

const BANNED_KEYS = [
  'latitude',
  'longitude',
  'altitude',
  'precision',
  'pointGeom',
  'geogPolygon',
  'isSensitive',
  'isSensitiveLocked',
  'author',
  'authors',
  'nickname',
  'surname',
  'mail',
  'files',
];

// A decimal-degree value, or degrees-minutes-seconds.
const POSITION_VALUE = /\d{1,3}[.,]\d{4,}|\d{1,3}°\s?\d{1,2}['′]/;

const assertNoPositionOrPerson = (output) => {
  keysDeep(output).forEach((key) => should(BANNED_KEYS).not.containEql(key));
  const text = JSON.stringify(output);
  should(text).not.match(POSITION_VALUE);
  ['Jane', 'Doe', 'jdoe', 'jane@example.org', 'club@example.org'].forEach(
    (needle) => should(text).not.containEql(needle)
  );
};

describe('botSurfaceWhitelist - fixtures with populated coordinates and persons', () => {
  it('publishes a 14-entrance cave without any position, protection flag or person', () => {
    const page = project('cave', 'top', caveRow());
    should(page.entrances).have.length(14);
    should(page.entrances[0]).have.property('discoveryYear', 1963);
    should(page.massifs).deepEqual([{ id: 3, name: 'Vercors' }]);
    assertNoPositionOrPerson(page);
  });

  it('keeps zero depth and length as 0 for the page to treat as unknown', () => {
    const page = project('cave', 'top', caveRow());
    should(page.length).equal(0);
  });

  it('publishes a massif without its polygon and with nested caves reduced to id, name, depth and length', () => {
    const page = project('massif', 'top', massifRow());
    should(page.caves).deepEqual([
      { id: 75262, name: 'Réseau des Écouges', depth: 320, length: 0 },
    ]);
    assertNoPositionOrPerson(page);
  });

  it('publishes a document with its organization authors and none of its person authors or files', () => {
    const page = project('document', 'top', documentRow());
    should(page.organizationAuthors).deepEqual([
      { id: 4, name: 'Spéléo Club' },
    ]);
    should(page.license).deepEqual({ name: 'CC-BY-SA', url: 'https://x' });
    should(page.subjects).deepEqual([{ id: 'AB', subject: 'Hydrology' }]);
    assertNoPositionOrPerson(page);
  });

  it('drops the author of a description', () => {
    const page = project('entrance', 'top', entranceRow(1));
    should(page.descriptions).deepEqual([
      { title: 'Accès', body: 'Un puits de 20 m.', language: 'fra' },
    ]);
  });
});
