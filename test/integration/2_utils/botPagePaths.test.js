const should = require('should');
const botPagePaths = require('../../../api/utils/botPagePaths');

describe('botPagePaths', () => {
  describe('toKey', () => {
    it('maps each type to its directory', () => {
      should(botPagePaths.toKey('cave', 123)).equal('caves/123.html');
      should(botPagePaths.toKey('massif', 7)).equal('massifs/7.html');
      should(botPagePaths.toKey('organization', 2147483647)).equal(
        'organizations/2147483647.html'
      );
    });

    it('rejects an unknown type, including inherited property names', () => {
      should(() => botPagePaths.toKey('entrance', 1)).throw(RangeError);
      should(() => botPagePaths.toKey('constructor', 1)).throw(RangeError);
      should(() => botPagePaths.toKey(undefined, 1)).throw(RangeError);
    });

    it('rejects an id that is not a positive integer of the id range', () => {
      [0, -1, 1.5, NaN, '12', null, 2147483648].forEach((id) => {
        should(() => botPagePaths.toKey('cave', id)).throw(RangeError);
      });
    });
  });

  describe('toUrl', () => {
    it('builds the public address from the default base URL', () => {
      should(botPagePaths.toUrl('cave', 123)).equal(
        'https://grottocenter.org/ui/caves/123'
      );
    });

    it('uses the base URL given, with or without a trailing slash', () => {
      should(botPagePaths.toUrl('massif', 4, 'https://example.test/x/')).equal(
        'https://example.test/x/massifs/4'
      );
      should(botPagePaths.toUrl('massif', 4, 'https://example.test/x')).equal(
        'https://example.test/x/massifs/4'
      );
    });
  });

  describe('fromKey', () => {
    it('reads a canonical key back', () => {
      should(botPagePaths.fromKey('organizations/42.html')).deepEqual({
        entityType: 'organization',
        id: 42,
      });
    });

    it('returns null for anything that is not the key of a page', () => {
      [
        '404.html',
        'caves/0.html',
        'caves/007.html',
        'caves/1.htm',
        'caves/1.html/',
        'caves/-1.html',
        'caves/1e3.html',
        'caves/99999999999.html',
        'caves/2147483648.html',
        'entrances/1.html',
        'constructor/1.html',
        '../caves/1.html',
        'a/caves/1.html',
        '',
        null,
        undefined,
        12,
      ].forEach((key) => should(botPagePaths.fromKey(key)).be.null());
    });
  });

  describe('fromUrl', () => {
    it('reads a canonical public address back', () => {
      should(
        botPagePaths.fromUrl('https://grottocenter.org/ui/massifs/9')
      ).deepEqual({ entityType: 'massif', id: 9 });
    });

    it('returns null for another host, a query string, a fragment or a trailing slash', () => {
      [
        'https://other.test/ui/caves/1',
        'https://grottocenter.org/ui/caves/1?a=1',
        'https://grottocenter.org/ui/caves/1#x',
        'https://grottocenter.org/ui/caves/1/',
        'https://grottocenter.org/ui/caves/1.html',
        'https://grottocenter.org/ui/caves',
        'https://grottocenter.org/caves/1',
        null,
      ].forEach((url) => should(botPagePaths.fromUrl(url)).be.null());
    });
  });

  describe('the hubs', () => {
    it('maps the index, a country and a region to their blob key and their address in the SPA', () => {
      [
        ['index', 'ALL', 'countries.html', 'countries'],
        ['country', 'FR', 'countries/FR.html', 'countries/FR'],
        [
          'region',
          'FR-01',
          'countries/FR/regions/01.html',
          'countries/FR/regions/01',
        ],
        [
          'region',
          'GB-CMN',
          'countries/GB/regions/CMN.html',
          'countries/GB/regions/CMN',
        ],
        [
          'region',
          'ES-A',
          'countries/ES/regions/A.html',
          'countries/ES/regions/A',
        ],
      ].forEach(([hubType, hubKey, key, tail]) => {
        should(botPagePaths.toHubKey(hubType, hubKey)).equal(key);
        should(botPagePaths.toHubUrl(hubType, hubKey)).equal(
          `https://grottocenter.org/ui/${tail}`
        );
        should(botPagePaths.fromKey(key)).deepEqual({
          entityType: 'hub',
          hubType,
          hubKey,
        });
        should(
          botPagePaths.fromUrl(`https://grottocenter.org/ui/${tail}`)
        ).deepEqual({ entityType: 'hub', hubType, hubKey });
      });
    });

    it('uses the base URL given', () => {
      should(
        botPagePaths.toHubUrl('country', 'FR', 'https://example.test/x/')
      ).equal('https://example.test/x/countries/FR');
    });

    it('rejects a hub that is not one: a lower-case code, a region for a country, an index key that is not ALL', () => {
      [
        ['country', 'fr'],
        ['country', 'FRA'],
        ['country', 'FR-01'],
        ['region', 'FR'],
        ['region', 'FR-0123'],
        ['region', 'fr-01'],
        ['region', 'FR-'],
        ['index', 'FR'],
        ['index', undefined],
        ['municipality', 'FR'],
        ['constructor', 'FR'],
        ['country', null],
      ].forEach(([hubType, hubKey]) => {
        should(() => botPagePaths.toHubKey(hubType, hubKey)).throw(RangeError);
        should(() => botPagePaths.toHubUrl(hubType, hubKey)).throw(RangeError);
      });
    });

    it('returns null for an address or a key that is not exactly a hub', () => {
      [
        'countries/fr.html',
        'countries/FR/.html',
        'countries/FR.html/',
        'countries/FR/regions.html',
        'countries/FR/regions/.html',
        'countries/FR/regions/0123.html',
        'countries/FR/regions/01/extra.html',
        'countries/FRA.html',
        'countries/FR.htm',
        'countries.htm',
        'Countries.html',
        'countries/constructor.html',
      ].forEach((key) => should(botPagePaths.fromKey(key)).be.null());
      [
        'https://grottocenter.org/ui/countries/',
        'https://grottocenter.org/ui/countries/FR/',
        'https://grottocenter.org/ui/countries/FR?x=1',
        'https://grottocenter.org/ui/countries/FR#x',
        'https://grottocenter.org/ui/countries/FR.html',
        'https://grottocenter.org/ui/countries/FR/regions',
        'https://grottocenter.org/ui/countries/fr',
        'https://other.test/ui/countries/FR',
      ].forEach((url) => should(botPagePaths.fromUrl(url)).be.null());
    });

    it('does not collide with the pages of the records', () => {
      should(botPagePaths.ENTITY_TYPES).deepEqual([
        'cave',
        'massif',
        'organization',
      ]);
      should(botPagePaths.HUB_TYPES).deepEqual(['index', 'country', 'region']);
      should(botPagePaths.fromKey('caves/1.html')).deepEqual({
        entityType: 'cave',
        id: 1,
      });
    });
  });
});
