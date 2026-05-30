#!/usr/bin/env node
/**
 * Import script for cave 74138 surface station data.
 * File: data/documents/74138/station surface Castanviels.xls
 *
 * Surface weather station measuring:
 *   - Pluviometre lame d'eau (rainfall, mm)
 *   - Température Sonde Atmo (temperature, °C)
 *   - Pression Atmo (atmospheric pressure, hPa/mbar)
 *
 * 8529 rows, 15-min interval, 2026-03-01 to 2026-05-31.
 * Point is on the surface (no cave association on the point).
 * Observation is linked to cave 74138.
 *
 * Usage:
 *   node scripts/import-cave-74138-surface.js > import-74138-surface.sql
 */

'use strict';

const path = require('path');

let XLSX;
try {
  XLSX = require('xlsx');
} catch {
  console.error('xlsx module not found. Run with:');
  console.error('  npx -p xlsx node scripts/import-cave-74138-surface.js');
  process.exit(1);
}

// ============================================================
// Configuration
// ============================================================

const CAVE_ID = 74138;
const AUTHOR_ID = 460;

const OBS_TYPE_ID = 2; // physical_measurements
const OBS_TYPE_CODE = 'physical_measurements';
const MEDIUM_AIR_ID = 2;
const MEDIUM_AIR_CODE = 'air';

// Quantity kind IDs
const QK = { TEMP: 1, PRES: 3, PRECIP: 9 };
// Unit IDs
const UNIT = { CELSIUS: 1, HPA: 3, MM: 10 };

const FILE = path.join(__dirname, '..', 'data', 'documents', '74138', 'station surface Castanviels.xls');

// SI conversions
const toK = (c) => +(c + 273.15).toFixed(4);
const toPa = (hpa) => +(hpa * 100).toFixed(2);
// Precipitation mm -> m (SI for length): 1mm = 0.001m
const toM = (mm) => +(mm / 1000).toFixed(6);

// ============================================================
// Parsing
// ============================================================

function parseFile() {
  const wb = XLSX.readFile(FILE);
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
  // First row is units header, skip it
  const dataRows = rows.slice(1);
  return dataRows.map((r) => {
    // Use ISO8601 column directly — already has timezone
    // Convert to UTC for storage: parse and output as ISO
    const isoStr = r['ISO8601'];
    const date = new Date(isoStr);
    const ts = date.toISOString().replace('T', ' ').replace('Z', '+00');
    return {
      ts,
      rainfall: r["Pluviometre lame d'eau"],
      temperature: r["Temp\u00c3\u00a9rature Sonde Atmo"],
      pressure: r["Pression Atmo"],
    };
  });
}

// ============================================================
// Stats
// ============================================================

function fieldStats(data, field) {
  const vals = data.map((r) => r[field]).filter((v) => v != null && !isNaN(v));
  if (!vals.length) return { count: 0, min: null, max: null };
  return { count: vals.length, min: Math.min(...vals), max: Math.max(...vals) };
}

// ============================================================
// SQL generation
// ============================================================

function main() {
  const data = parseFile();

  const o = [];
  const emit = (s = '') => o.push(s);

  const startTs = data[0].ts;
  const endTs = data[data.length - 1].ts;

  emit('-- ============================================================');
  emit(`-- Import: Cave ${CAVE_ID} surface station (Castanviels)`);
  emit(`-- ${data.length} rows, 15min interval, ${startTs} to ${endTs}`);
  emit(`-- Channels: rainfall (mm), temperature (°C), pressure (hPa)`);
  emit(`-- Generated: ${new Date().toISOString()}`);
  emit('-- ============================================================');
  emit();
  emit('BEGIN;');
  emit();
  emit('-- Fix sequences');
  emit(`SELECT setval('t_device_id_seq', (SELECT COALESCE(MAX(id), 0) FROM t_device));`);
  emit(`SELECT setval('t_sensor_configuration_id_seq', (SELECT COALESCE(MAX(id), 0) FROM t_sensor_configuration));`);
  emit(`SELECT setval('t_point_id_seq', (SELECT COALESCE(MAX(id), 0) FROM t_point));`);
  emit(`SELECT setval('t_observation_id_seq', (SELECT COALESCE(MAX(id), 0) FROM t_observation));`);
  emit(`SELECT setval('t_time_series_id_seq', (SELECT COALESCE(MAX(id), 0) FROM t_time_series));`);
  emit();

  // --- Device ---
  emit('-- Device: surface weather station');
  emit(`INSERT INTO t_device (name, brand_name)`);
  emit(`  VALUES ('Cave ${CAVE_ID} Station Surface Castanviels', NULL);`);
  emit();

  // --- Sensor configurations + point + observation + time series in DO block ---
  emit('CREATE TEMP TABLE _import_ts_ids (');
  emit('  label TEXT PRIMARY KEY,');
  emit('  ts_id INT NOT NULL');
  emit(');');
  emit();

  const channels = [
    { field: 'rainfall', qk: QK.PRECIP, unit: UNIT.MM, qkCode: 'Precipitation', unitSym: 'mm' },
    { field: 'temperature', qk: QK.TEMP, unit: UNIT.CELSIUS, qkCode: 'Temperature', unitSym: '°C' },
    { field: 'pressure', qk: QK.PRES, unit: UNIT.HPA, qkCode: 'AtmosphericPressure', unitSym: 'hPa' },
  ];

  emit('DO $$');
  emit('DECLARE');
  emit('  v_device_id INT;');
  emit('  v_point_id INT;');
  emit('  v_obs_id INT;');
  emit('  v_ts_id INT;');
  emit('BEGIN');
  emit();
  emit(`  v_device_id := currval('t_device_id_seq');`);
  emit();

  // Sensor configurations (3 channels)
  for (const ch of channels) {
    emit(`  INSERT INTO t_sensor_configuration (id_device, id_quantity_kind, id_unit)`);
    emit(`    VALUES (v_device_id, ${ch.qk}, ${ch.unit});`);
  }
  emit();

  // Point (surface — no id_cave on the point itself)
  emit(`  INSERT INTO t_point (id_author, date_inscription, label, id_cave, is_deleted)`);
  emit(`    VALUES (${AUTHOR_ID}, now(), 'Station Surface Castanviels', NULL, false)`);
  emit(`    RETURNING id INTO v_point_id;`);
  emit();

  // Observation (linked to cave for context)
  emit(`  INSERT INTO t_observation (`);
  emit(`    id_author, date_inscription, observation_date, id_point, id_cave,`);
  emit(`    id_observation_type, observation_type_code, point_label, is_deleted`);
  emit(`  ) VALUES (`);
  emit(`    ${AUTHOR_ID}, now(), '${startTs}', v_point_id, ${CAVE_ID},`);
  emit(`    ${OBS_TYPE_ID}, '${OBS_TYPE_CODE}', 'Station Surface Castanviels', false`);
  emit(`  ) RETURNING id INTO v_obs_id;`);
  emit();

  // Time series (3 channels)
  for (let i = 0; i < channels.length; i++) {
    const ch = channels[i];
    const st = fieldStats(data, ch.field);
    const scOffset = channels.length - 1 - i; // offset from currval

    emit(`  INSERT INTO t_time_series (`);
    emit(`    id_author, date_inscription, id_observation, id_sensor_configuration,`);
    emit(`    id_medium, sampling_interval_seconds, start_date, end_date,`);
    emit(`    measurement_count, min_value, max_value, data_quality,`);
    emit(`    quantity_kind_code, unit_symbol, medium_code, is_deleted`);
    emit(`  ) VALUES (`);
    emit(`    ${AUTHOR_ID}, now(), v_obs_id, currval('t_sensor_configuration_id_seq') - ${scOffset},`);
    emit(`    ${MEDIUM_AIR_ID}, 900, '${startTs}', '${endTs}',`);
    emit(`    ${st.count}, ${st.min}, ${st.max}, 'raw',`);
    emit(`    '${ch.qkCode}', '${ch.unitSym}', '${MEDIUM_AIR_CODE}', false`);
    emit(`  ) RETURNING id INTO v_ts_id;`);
    emit(`  INSERT INTO _import_ts_ids VALUES ('${ch.field}', v_ts_id);`);
    emit();
  }

  emit('END $$;');
  emit();

  // --- Measurements (bulk inserts) ---
  emit('-- ============================================================');
  emit('-- Measurements (bulk insert)');
  emit('-- ============================================================');
  emit();

  const BATCH_SIZE = 200;

  for (const ch of channels) {
    const rows = data.filter((r) => r[ch.field] != null && !isNaN(r[ch.field]));
    if (!rows.length) continue;

    emit(`-- ${ch.field}: ${rows.length} measurements`);

    for (let batch = 0; batch < rows.length; batch += BATCH_SIZE) {
      const chunk = rows.slice(batch, batch + BATCH_SIZE);
      emit(`INSERT INTO t_measurement (id_time_series, value, value_si, timestamp)`);
      emit(`SELECT ts_id, v.value, v.value_si, v.ts FROM _import_ts_ids, (VALUES`);

      const valueLines = chunk.map((r, idx) => {
        const val = r[ch.field];
        let valueSi;
        switch (ch.field) {
          case 'temperature': valueSi = toK(val); break;
          case 'pressure': valueSi = toPa(val); break;
          case 'rainfall': valueSi = toM(val); break;
          default: valueSi = val;
        }
        const comma = idx < chunk.length - 1 ? ',' : '';
        return `  (${val}::numeric, ${valueSi}::numeric, '${r.ts}'::timestamptz)${comma}`;
      });

      for (const line of valueLines) emit(line);
      emit(`) AS v(value, value_si, ts)`);
      emit(`WHERE _import_ts_ids.label = '${ch.field}';`);
      emit();
    }
  }

  // Cleanup
  emit('DROP TABLE _import_ts_ids;');
  emit();
  emit('COMMIT;');
  emit();
  emit('-- Verify:');
  emit(`-- SELECT ts.id, ts.quantity_kind_code, ts.unit_symbol, ts.measurement_count`);
  emit(`-- FROM t_time_series ts`);
  emit(`-- JOIN t_observation o ON o.id = ts.id_observation`);
  emit(`-- WHERE o.id_cave = ${CAVE_ID} AND o.point_label = 'Station Surface Castanviels';`);

  process.stdout.write(o.join('\n') + '\n');
}

main();
