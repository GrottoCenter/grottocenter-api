/**
 * Integration tests verifying denormalized substance and compound labels
 * in the v_measurement_wide analytics view.
 *
 * Since the test database does not run the full DDL script (Waterline's
 * migrate:drop only creates tables), we create the view inline and verify
 * its column structure and label logic.
 *
 * NOTE: The `geom` column from the production view is intentionally excluded
 * to keep the test view minimal — the test DB lacks PostGIS extensions
 * required for spatial functions.
 */
const should = require('should');

const CREATE_VIEW_SQL = `
CREATE OR REPLACE VIEW v_measurement_wide_test AS
SELECT
  m.id AS measurement_id,
  m.value,
  CASE WHEN iu.dimension = du.dimension
    THEN m.value_si
    ELSE NULL
  END AS value_si,
  CASE WHEN iu.dimension = du.dimension
    THEN m.value_si * du.factor_to_si + du.offset_to_si
    ELSE NULL
  END AS value_display,
  iu.dimension AS import_dimension,
  du.dimension AS display_dimension,
  m.timestamp,
  ts.id AS time_series_id,
  ts.quantity_kind_code,
  ts.unit_symbol,
  ts.substance_label,
  CASE WHEN ts.substance_label IS NOT NULL
    THEN ts.quantity_kind_code || ' [' || ts.substance_label || '] (' || ts.unit_symbol || ')'
    ELSE ts.quantity_kind_code || ' (' || ts.unit_symbol || ')'
  END AS quantity_unit,
  qk.symbol_si AS unit_si,
  CASE WHEN ts.substance_label IS NOT NULL
    THEN ts.quantity_kind_code || ' [' || ts.substance_label || '] (' || qk.symbol_si || ')'
    ELSE ts.quantity_kind_code || ' (' || qk.symbol_si || ')'
  END AS quantity_unit_si,
  du.symbol AS unit_display,
  CASE WHEN ts.substance_label IS NOT NULL
    THEN ts.quantity_kind_code || ' [' || ts.substance_label || '] (' || du.symbol || ')'
    ELSE ts.quantity_kind_code || ' (' || du.symbol || ')'
  END AS quantity_unit_display,
  ts.medium_code,
  ts.data_quality,
  ts.sampling_interval_seconds,
  o.id AS observation_id,
  o.observation_date,
  o.observation_type_code,
  o.cave_name,
  o.point_label,
  o.latitude,
  o.longitude,
  COALESCE(o.id_cave, p.id_cave) AS cave_id,
  ts.id_sensor_configuration
FROM t_measurement m
JOIN t_time_series ts ON ts.id = m.id_time_series
JOIN t_observation o ON o.id = ts.id_observation
LEFT JOIN t_point p ON p.id = o.id_point
LEFT JOIN t_quantity_kind qk ON qk.code = ts.quantity_kind_code
LEFT JOIN t_unit du ON du.id = qk.id_display_unit
LEFT JOIN t_unit iu ON iu.symbol = ts.unit_symbol
WHERE o.is_deleted = false
  AND ts.is_deleted = false;
`;

describe('v_measurement_wide substance columns', () => {
  before(async () => {
    await CommonService.query(CREATE_VIEW_SQL);
  });

  after(async () => {
    await CommonService.query('DROP VIEW IF EXISTS v_measurement_wide_test;');
  });

  it('should include substance_label column in the view definition', async () => {
    const result = await CommonService.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'v_measurement_wide_test' AND column_name = 'substance_label';"
    );
    should(result.rows).have.length(1);
    should(result.rows[0].column_name).equal('substance_label');
  });

  it('should include quantity_unit column', async () => {
    const result = await CommonService.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'v_measurement_wide_test' AND column_name = 'quantity_unit';"
    );
    should(result.rows).have.length(1);
  });

  it('should include quantity_unit_si column', async () => {
    const result = await CommonService.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'v_measurement_wide_test' AND column_name = 'quantity_unit_si';"
    );
    should(result.rows).have.length(1);
  });

  it('should include quantity_unit_display column', async () => {
    const result = await CommonService.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'v_measurement_wide_test' AND column_name = 'quantity_unit_display';"
    );
    should(result.rows).have.length(1);
  });

  it('should format compound label with substance when non-null', async () => {
    // Insert test data to verify the CASE expression logic
    const qk = await CommonService.query(
      "SELECT id, code FROM t_quantity_kind WHERE code = 'Concentration' LIMIT 1;"
    );
    if (qk.rows.length === 0) return; // Skip if no Concentration QK in test DB

    // Ensure a partition exists for the current quarter
    const now = new Date();
    const quarter = Math.floor(now.getMonth() / 3);
    const partStart = new Date(now.getFullYear(), quarter * 3, 1);
    const partEnd = new Date(now.getFullYear(), (quarter + 1) * 3, 1);
    const partName = `t_measurement_${partStart.getFullYear()}_q${quarter + 1}`;
    await CommonService.query(`
      CREATE TABLE IF NOT EXISTS ${partName} PARTITION OF t_measurement
      FOR VALUES FROM ('${partStart.toISOString()}') TO ('${partEnd.toISOString()}');
    `);

    // Create a minimal observation
    const obs = await CommonService.query(`
      INSERT INTO t_observation (
        id_observation_type, observation_type_code, observation_date,
        id_author, date_inscription, is_deleted
      ) VALUES (
        (SELECT id FROM t_observation_type WHERE code = 'physical_measurements' LIMIT 1),
        'physical_measurements', NOW(), 1, NOW(), false
      ) RETURNING id;
    `);
    const obsId = obs.rows[0].id;

    // Create a time series with substance_label
    const ts = await CommonService.query(`
      INSERT INTO t_time_series (
        id_observation, id_sensor_configuration, id_author,
        date_inscription, start_date, end_date, measurement_count,
        min_value, max_value, data_quality, quantity_kind_code,
        unit_symbol, substance_label, is_deleted
      ) VALUES (
        ${obsId}, 4, 1, NOW(), NOW(), NOW(), 1,
        0.5, 0.5, 'raw', 'Concentration',
        'µM', 'NO₃⁻', false
      ) RETURNING id;
    `);
    const tsId = ts.rows[0].id;

    // Create a measurement in the partition
    await CommonService.query(`
      INSERT INTO t_measurement (id_time_series, value, value_si, timestamp)
      VALUES (${tsId}, 0.5, 0.0000005, '${now.toISOString()}');
    `);

    // Query the view
    const viewResult = await CommonService.query(`
      SELECT quantity_unit, quantity_unit_si, quantity_unit_display, substance_label
      FROM v_measurement_wide_test
      WHERE time_series_id = ${tsId};
    `);

    should(viewResult.rows.length).be.above(0);
    const row = viewResult.rows[0];
    should(row.substance_label).equal('NO₃⁻');
    should(row.quantity_unit).equal('Concentration [NO₃⁻] (µM)');

    // Cleanup
    await CommonService.query(
      `DELETE FROM t_measurement WHERE id_time_series = ${tsId};`
    );
    await CommonService.query(`DELETE FROM t_time_series WHERE id = ${tsId};`);
    await CommonService.query(`DELETE FROM t_observation WHERE id = ${obsId};`);
  });

  it('should format label without substance brackets when null', async () => {
    const qk = await CommonService.query(
      "SELECT id, code FROM t_quantity_kind WHERE code = 'Temperature' LIMIT 1;"
    );
    if (qk.rows.length === 0) return; // Skip if no Temperature QK in test DB

    // Ensure a partition exists for the current quarter
    const now = new Date();
    const quarter = Math.floor(now.getMonth() / 3);
    const partStart = new Date(now.getFullYear(), quarter * 3, 1);
    const partEnd = new Date(now.getFullYear(), (quarter + 1) * 3, 1);
    const partName = `t_measurement_${partStart.getFullYear()}_q${quarter + 1}`;
    await CommonService.query(`
      CREATE TABLE IF NOT EXISTS ${partName} PARTITION OF t_measurement
      FOR VALUES FROM ('${partStart.toISOString()}') TO ('${partEnd.toISOString()}');
    `);

    // Create a minimal observation
    const obs = await CommonService.query(`
      INSERT INTO t_observation (
        id_observation_type, observation_type_code, observation_date,
        id_author, date_inscription, is_deleted
      ) VALUES (
        (SELECT id FROM t_observation_type WHERE code = 'physical_measurements' LIMIT 1),
        'physical_measurements', NOW(), 1, NOW(), false
      ) RETURNING id;
    `);
    const obsId = obs.rows[0].id;

    // Create a time series without substance
    const ts = await CommonService.query(`
      INSERT INTO t_time_series (
        id_observation, id_sensor_configuration, id_author,
        date_inscription, start_date, end_date, measurement_count,
        min_value, max_value, data_quality, quantity_kind_code,
        unit_symbol, substance_label, is_deleted
      ) VALUES (
        ${obsId}, 1, 1, NOW(), NOW(), NOW(), 1,
        20.0, 20.0, 'raw', 'Temperature',
        '°C', NULL, false
      ) RETURNING id;
    `);
    const tsId = ts.rows[0].id;

    // Create a measurement in the partition
    await CommonService.query(`
      INSERT INTO t_measurement (id_time_series, value, value_si, timestamp)
      VALUES (${tsId}, 20.0, 293.15, '${now.toISOString()}');
    `);

    // Query the view
    const viewResult = await CommonService.query(`
      SELECT quantity_unit, substance_label
      FROM v_measurement_wide_test
      WHERE time_series_id = ${tsId};
    `);

    should(viewResult.rows.length).be.above(0);
    const row = viewResult.rows[0];
    should(row.substance_label).equal(null);
    should(row.quantity_unit).equal('Temperature (°C)');

    // Cleanup
    await CommonService.query(
      `DELETE FROM t_measurement WHERE id_time_series = ${tsId};`
    );
    await CommonService.query(`DELETE FROM t_time_series WHERE id = ${tsId};`);
    await CommonService.query(`DELETE FROM t_observation WHERE id = ${obsId};`);
  });
});
