const should = require('should');
const fc = require('fast-check');
const botPagePaths = require('../../../api/utils/botPagePaths');

// The ids the pages can have: a Postgres integer primary key
const idArb = fc.integer({ min: 1, max: 2147483647 });
const typeArb = fc.constantFrom(...botPagePaths.ENTITY_TYPES);
// A base URL as configured: scheme, host, optional path, with or without a trailing slash
const baseUrlArb = fc
  .tuple(
    fc.constantFrom('http', 'https'),
    fc.domain(),
    fc.array(fc.stringMatching(/^[a-z0-9-]{1,8}$/), { maxLength: 3 }),
    fc.boolean()
  )
  .map(
    ([scheme, host, segments, slash]) =>
      `${scheme}://${host}${segments.map((s) => `/${s}`).join('')}${
        slash ? '/' : ''
      }`
  );

describe('botPagePaths - Property: the mapping is a bijection on valid pages', () => {
  it('key -> (type, id) -> key returns the same key, and the reverse', () => {
    fc.assert(
      fc.property(typeArb, idArb, (entityType, id) => {
        const key = botPagePaths.toKey(entityType, id);
        const parsed = botPagePaths.fromKey(key);
        should(parsed).deepEqual({ entityType, id });
        should(botPagePaths.toKey(parsed.entityType, parsed.id)).equal(key);
      })
    );
  });

  it('url -> (type, id) -> url returns the same url, for any base URL', () => {
    fc.assert(
      fc.property(typeArb, idArb, baseUrlArb, (entityType, id, baseUrl) => {
        const url = botPagePaths.toUrl(entityType, id, baseUrl);
        const parsed = botPagePaths.fromUrl(url, baseUrl);
        should(parsed).deepEqual({ entityType, id });
        should(botPagePaths.toUrl(parsed.entityType, parsed.id, baseUrl)).equal(
          url
        );
      })
    );
  });

  it('two different pages never share a key or a url', () => {
    fc.assert(
      fc.property(typeArb, idArb, typeArb, idArb, (t1, i1, t2, i2) => {
        fc.pre(t1 !== t2 || i1 !== i2);
        should(botPagePaths.toKey(t1, i1)).not.equal(
          botPagePaths.toKey(t2, i2)
        );
        should(botPagePaths.toUrl(t1, i1)).not.equal(
          botPagePaths.toUrl(t2, i2)
        );
      })
    );
  });

  it('only a canonical key parses: any string that parses is the key of its (type, id)', () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 40 }), (candidate) => {
        const parsed = botPagePaths.fromKey(candidate);
        if (parsed === null) return;
        if (parsed.entityType === 'hub') {
          should(botPagePaths.toHubKey(parsed.hubType, parsed.hubKey)).equal(
            candidate
          );
        } else {
          should(botPagePaths.toKey(parsed.entityType, parsed.id)).equal(
            candidate
          );
        }
      }),
      { numRuns: 500 }
    );
  });

  it('only a canonical url parses: a mutated key or url does not', () => {
    fc.assert(
      fc.property(
        typeArb,
        idArb,
        fc.constantFrom('?x=1', '#f', '/', ' ', '.html', '%20'),
        (entityType, id, suffix) => {
          should(
            botPagePaths.fromUrl(botPagePaths.toUrl(entityType, id) + suffix)
          ).be.null();
          should(
            botPagePaths.fromKey(botPagePaths.toKey(entityType, id) + suffix)
          ).be.null();
        }
      )
    );
  });

  describe('the hubs', () => {
    const countryArb = fc.stringMatching(/^[A-Z]{2}$/);
    const hubArb = fc.oneof(
      fc.constant(['index', 'ALL']),
      countryArb.map((code) => ['country', code]),
      fc
        .tuple(countryArb, fc.stringMatching(/^[A-Z0-9]{1,3}$/))
        .map(([country, suffix]) => ['region', `${country}-${suffix}`])
    );

    it('key -> hub -> key and url -> hub -> url return the same value, for any base URL', () => {
      fc.assert(
        fc.property(hubArb, baseUrlArb, ([hubType, hubKey], baseUrl) => {
          const key = botPagePaths.toHubKey(hubType, hubKey);
          should(botPagePaths.fromKey(key)).deepEqual({
            entityType: 'hub',
            hubType,
            hubKey,
          });
          const url = botPagePaths.toHubUrl(hubType, hubKey, baseUrl);
          should(botPagePaths.fromUrl(url, baseUrl)).deepEqual({
            entityType: 'hub',
            hubType,
            hubKey,
          });
        })
      );
    });

    it('two different hubs never share a key or a url, and never share one with a record', () => {
      fc.assert(
        fc.property(hubArb, hubArb, typeArb, idArb, (a, b, type, id) => {
          fc.pre(a[0] !== b[0] || a[1] !== b[1]);
          should(botPagePaths.toHubKey(...a)).not.equal(
            botPagePaths.toHubKey(...b)
          );
          should(botPagePaths.toHubUrl(...a)).not.equal(
            botPagePaths.toHubUrl(...b)
          );
          should(botPagePaths.toHubKey(...a)).not.equal(
            botPagePaths.toKey(type, id)
          );
        })
      );
    });

    it('a mutated key or url of a hub does not parse', () => {
      fc.assert(
        fc.property(
          hubArb,
          fc.constantFrom('?x=1', '#f', '/', ' ', '.html', '%20'),
          ([hubType, hubKey], suffix) => {
            should(
              botPagePaths.fromUrl(
                botPagePaths.toHubUrl(hubType, hubKey) + suffix
              )
            ).be.null();
            should(
              botPagePaths.fromKey(
                botPagePaths.toHubKey(hubType, hubKey) + suffix
              )
            ).be.null();
          }
        )
      );
    });
  });
});
