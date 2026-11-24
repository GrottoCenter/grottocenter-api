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
}).timeout(60000);
