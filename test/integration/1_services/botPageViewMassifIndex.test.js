const should = require('should');

// #2022: idx_t_massif_geog is partial (WHERE is_deleted = false). The planner
// uses a partial index only when the query states its predicate on that very
// table alias; without it every cave compared its entrances with every massif
// polygon (about 32,000 buffers per cave in production).
describe('v_bot_page - the massif lookup of a cave can use idx_t_massif_geog', () => {
  it('states is_deleted = false on the massif that is joined spatially', async () => {
    const { rows } = await CommonService.query(
      "SELECT pg_get_viewdef('v_bot_page'::regclass) AS def"
    );
    const def = rows[0].def.replace(/\s+/g, ' ');

    should(def).match(/m2\.is_deleted = false/);
    should(def).match(/st_contains\(\(m2\.geog_polygon\)::geometry/i);
  });

  it('plans the massif lookup on idx_t_massif_geog', async () => {
    // With seq scans off the planner takes the partial index whenever it can,
    // whatever the size of the fixtures; a changed index predicate or a type
    // mismatch on && makes it fall back to a sequential scan. It selects page:
    // the planner drops the massif join from a plan that does not read it
    let plan;
    await sails.getDatastore().transaction(async (db) => {
      await CommonService.query('SET LOCAL enable_seqscan = off', [], db);
      const { rows } = await CommonService.query(
        "EXPLAIN SELECT page FROM v_bot_page WHERE entity_type = 'cave'",
        [],
        db
      );
      plan = rows.map((r) => r['QUERY PLAN']).join('\n');
    });

    should(plan).match(/idx_t_massif_geog/);
  });
}).timeout(60000);
