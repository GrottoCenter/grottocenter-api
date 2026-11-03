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
});
