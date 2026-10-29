const should = require('should');
const {
  WHITELIST,
  project,
} = require('../../../api/utils/botSurfaceWhitelist');

// Written out by hand on purpose: widening the published surface must show up
// as a reviewed change to this snapshot, not follow the module automatically.
const EXPECTED = {
  description: { top: ['body', 'language', 'title'] },
  license: { top: ['name', 'url'] },
  subject: { top: ['id', 'subject'] },
  cave: {
    top: [
      'depth',
      'descriptions',
      'entrances',
      'id',
      'isDiving',
      'language',
      'lastmod',
      'length',
      'massifs',
      'name',
      'temperature',
    ],
    nested: ['depth', 'id', 'length', 'name'],
  },
  entrance: {
    top: [
      'city',
      'country',
      'county',
      'dangerCo2',
      'dangerFlooding',
      'dangerPollution',
      'dangerRockfall',
      'descriptions',
      'discoveryYear',
      'hasBat',
      'hasRules',
      'id',
      'isTouristic',
      'language',
      'name',
      'needCleanGear',
      'needStayOnTrail',
      'region',
      'regionCode',
    ],
    nested: ['id', 'name'],
  },
  massif: {
    top: ['caves', 'descriptions', 'id', 'language', 'lastmod', 'name'],
    nested: ['id', 'name'],
  },
  organization: {
    top: [
      'city',
      'country',
      'county',
      'id',
      'language',
      'lastmod',
      'name',
      'region',
      'url',
      'yearBirth',
    ],
    nested: ['id', 'name'],
  },
  document: {
    top: [
      'datePublication',
      'descriptions',
      'id',
      'identifier',
      'identifierType',
      'language',
      'lastmod',
      'license',
      'organizationAuthors',
      'subjects',
      'title',
      'type',
    ],
    nested: ['id', 'title'],
  },
};

// Names that must never be published at any level, written independently of
// the module under test.
const FORBIDDEN = [
  'latitude',
  'longitude',
  'altitude',
  'precision',
  'point_geom',
  'pointGeom',
  'geogPolygon',
  'isSensitive',
  'isSensitiveLocked',
  'author',
  'authors',
  'reviewer',
  'validator',
  'cavers',
  'nbCavers',
  'nickname',
  'surname',
  'name_cave',
  'isDeleted',
  'redirectTo',
  'idDbImport',
  'nameDbImport',
  'dateInscription',
  'dateReviewed',
  'locations',
  'comments',
  'riggings',
  'histories',
  'contact',
  'modalities',
  'externalUrl',
  'dataQuality',
  'address',
  'postalCode',
  'mail',
  'customMessage',
  'geology',
  'files',
];

describe('botSurfaceWhitelist - field names', () => {
  it('matches the reviewed snapshot for every entity type and level', () => {
    should(WHITELIST).deepEqual(EXPECTED);
  });

  it('keeps every nested set a proper subset of its top-level set', () => {
    Object.values(WHITELIST).forEach((levels) => {
      if (!levels.nested) return;
      should(levels.nested.length).be.below(levels.top.length);
      levels.nested.forEach((field) => {
        should(levels.top).containEql(field);
      });
    });
  });

  it('names none of the fields that are never published', () => {
    Object.entries(WHITELIST).forEach(([, levels]) => {
      Object.values(levels)
        .flat()
        .forEach((field) => should(FORBIDDEN).not.containEql(field));
    });
  });

  it('is frozen, so no caller can widen it at runtime', () => {
    should(Object.isFrozen(WHITELIST)).be.true();
    should(Object.isFrozen(WHITELIST.cave)).be.true();
    should(Object.isFrozen(WHITELIST.cave.top)).be.true();
  });
});

describe('botSurfaceWhitelist - project', () => {
  it('keeps the named fields and drops the others', () => {
    const result = project('organization', 'nested', {
      id: 7,
      name: 'Spéléo Club',
      mail: 'club@example.org',
      latitude: 46.1,
    });
    should(result).deepEqual({ id: 7, name: 'Spéléo Club' });
  });

  it('keeps falsy values such as 0, false and null', () => {
    const result = project('cave', 'nested', {
      id: 1,
      name: '',
      depth: 0,
      length: null,
    });
    should(result).deepEqual({ id: 1, name: '', depth: 0, length: null });
  });

  it('omits a named field that is absent or undefined', () => {
    const result = project('cave', 'nested', { id: 1, depth: undefined });
    should(result).deepEqual({ id: 1 });
  });

  it('ignores inherited properties and a polluted prototype key', () => {
    const row = JSON.parse('{"id": 1, "__proto__": {"name": "x"}}');
    should(project('massif', 'nested', row)).deepEqual({ id: 1 });
  });

  it('projects nested entities with their own level', () => {
    const result = project('massif', 'top', {
      id: 3,
      name: 'Vercors',
      geogPolygon: { type: 'Polygon', coordinates: [[[5.1, 45.1]]] },
      caves: [
        { id: 10, name: 'Gouffre', depth: 100, length: 0, latitude: 45.1 },
      ],
    });
    should(result).deepEqual({
      id: 3,
      name: 'Vercors',
      caves: [{ id: 10, name: 'Gouffre', depth: 100, length: 0 }],
    });
  });

  it('projects a single nested object and keeps null', () => {
    const doc = project('document', 'top', {
      id: 1,
      license: { name: 'CC-BY-SA', url: 'https://x', isCopyrighted: false },
      descriptions: null,
    });
    should(doc).deepEqual({
      id: 1,
      license: { name: 'CC-BY-SA', url: 'https://x' },
      descriptions: null,
    });
  });

  it('accepts a Date as a scalar', () => {
    const lastmod = new Date('2026-01-01T00:00:00Z');
    should(project('cave', 'top', { id: 1, lastmod }).lastmod).equal(lastmod);
  });

  it('throws a RangeError for an unknown entity type or level', () => {
    should(() => project('person', 'top', {})).throw(RangeError);
    should(() => project('cave', 'deep', {})).throw(RangeError);
    should(() => project('license', 'nested', {})).throw(RangeError);
    should(() => project('constructor', 'top', {})).throw(RangeError);
    should(() => project('cave', '__proto__', {})).throw(RangeError);
  });

  it('throws a TypeError when the row is not a plain object', () => {
    [null, undefined, 'cave', 42, [], new Date()].forEach((row) => {
      should(() => project('cave', 'top', row)).throw(TypeError);
    });
  });

  it('refuses an object in a scalar field instead of copying it', () => {
    should(() =>
      project('cave', 'top', { id: 1, name: { fr: 'a', secret: 'b' } })
    ).throw(TypeError);
    should(() => project('cave', 'top', { id: [1] })).throw(TypeError);
  });

  it('names the path of the offending field in the error', () => {
    const row = {
      id: 1,
      entrances: [{ id: 2 }, { id: 3, descriptions: [{ title: { fr: 'x' } }] }],
    };
    should(() => project('cave', 'top', row)).throw(
      'Field "cave.entrances[1].descriptions[0].title" must be a scalar, got object'
    );
    should(() => project('cave', 'top', { id: [1] })).throw(
      'Field "cave.id" must be a scalar, got array'
    );
    should(() => project('cave', 'top', { entrances: [{ id: 2 }, 'x'] })).throw(
      /cave\.entrances\[1\] \(entrance\).*got string/
    );
  });

  it('does not alter the row it is given', () => {
    const row = { id: 1, name: 'a', latitude: 46.1 };
    project('cave', 'nested', row);
    should(row).deepEqual({ id: 1, name: 'a', latitude: 46.1 });
  });
});
