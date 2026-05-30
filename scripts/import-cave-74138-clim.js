#!/usr/bin/env node
/**
 * Import script for cave 74138 climate data (Clim B 1.xlsx and Clim B 2.xlsx).
 *
 * Outputs SQL to stdout. Uses a single transaction with a DO $$ block to
 * track generated IDs, followed by bulk COPY-style INSERT statements for
 * measurements.
 *
 * Usage:
 *   npx -p xlsx node scripts/import-cave-74138-clim.js > import-74138.sql
 *   # Review, then run against prod:
 *   psql -h <host> -U <user> -d grottoce -f import-74138.sql
 *
 * Two loggers at two different points in cave 74138:
 *   - Clim B 1: hourly sampling, 865 measurements (2025-10-22 to 2025-11-27)
 *   - Clim B 2: ~15min sampling, 1060 measurements (2025-10-11 to 2025-11-27)
 *
 * Each logger records 7 channels:
 *   Temperature (°C), Pressure (hPa), Humidity (%), Dew Point (°C),
 *   CO2 (ppm), Secondary Temperature (°C), Secondary Humidity (%)
 */

'use strict';

const path = require('path');

let XLSX;
try {
  XLSX = require('xlsx');
} catch {
  console.error('xlsx module not found. Run with:');
  console.error('  npx -p xlsx node scripts/import-cave-74138-clim.js');
  process.exit(1);
}

// ============================================================
// Configuration
// ============================================================

const CAVE_ID = 74138;
const AUTHOR_ID = 460;

// Lookup IDs (from seed data in sql/9_05_*.sql)
const OBS_TYPE_ID = 2; // physical_measurements
const OBS_TYPE_CODE = 'physical_measurements';
const MEDIUM_AIR_ID = 2;
const MEDIUM_AIR_CODE = 'air';
const QK = { TEMP: 1, HUM: 2, PRES: 3, CO2: 4, DEW: 10 };
const UNIT = { CELSIUS: 1, PERCENT: 2, HPA: 3, PPM: 4 };

const DATA_DIR = path.join(__dirname, '..', 'data', 'documents', '74138');
const FILE_1 = path.join(DATA_DIR, 'Clim B 1.xlsx');
const FILE_2 = path.join(DATA_DIR, 'Clim B 2.xlsx');

const EXCEL_EPOCH_MS = new Date(Date.UTC(1899, 11, 30)).getTime();

// ============================================================
// Helpers
// ============================================================

function excelToISO(serialDate, timeFraction) {
  const ms = (serialDate + timeFraction) * 86400000;
  return new Date(EXCEL_EPOCH_MS + ms).toISOString()
    .replace('T', ' ').replace('Z', '+00');
}

// SI conversions
const toK = (c) => +(c + 273.15).toFixed(4);
const toPa = (hpa) => +(hpa * 100).toFixed(2);
const toFrac = (pct) => +(pct / 100).toFixed(6);
const toMolMol = (ppm) => +(ppm / 1000000).toFixed(10);

// ============================================================
// Parsing
// ============================================================

function parseFile1() {
  const wb = XLSX.readFile(FILE_1);
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
  return rows.map((r) => ({
    ts: excelToISO(r['YY/MM/DD'], r['UTCh:m:s']),
    temp: parseFloat(r['Tmp*C']),
    pres: parseFloat(r['Prs*hPa']),
    hum: parseFloat(r['Rhum%']),
    dew: parseFloat(r['Dew*C']),
    co2: r['CO2ppm'] != null ? parseInt(r['CO2ppm'], 10) : null,
    temp2: parseFloat(r['TFLx']),
    hum2: parseFloat(r['HFLy']),
  }));
}

function parseFile2() {
  const wb = XLSX.readFile(FILE_2);
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
  return rows.map((r) => {
    if ('__EMPTY' in r) {
      // CO2ppm present but header missing — columns shifted right
      return {
        ts: excelToISO(r['YY/MM/DD'], r['UTCh:m:s']),
        temp: parseFloat(r['Tmp*C']),
        pres: parseFloat(r['Prs*hPa']),
        hum: parseFloat(r['Rhum%']),
        dew: parseFloat(r['Dew*C']),
        co2: parseInt(r['CO2%'], 10),
        temp2: parseFloat(r['HFLy']),
        hum2: parseFloat(r['__EMPTY']),
      };
    }
    // No CO2ppm for this row
    return {
      ts: excelToISO(r['YY/MM/DD'], r['UTCh:m:s']),
      temp: parseFloat(r['Tmp*C']),
      pres: parseFloat(r['Prs*hPa']),
      hum: parseFloat(r['Rhum%']),
      dew: parseFloat(r['Dew*C']),
      co2: null,
      temp2: parseFloat(r['TFLx']),
      hum2: parseFloat(r['HFLy']),
    };
  });
}

// ============================================================
// Stats helpers
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
  const d1 = parseFile1();
  const d2 = parseFile2();

  const o = [];
  const emit = (s = '') => o.push(s);

  emit('-- ============================================================');
  emit(`-- Import: Cave ${CAVE_ID} climate monitoring data`);
  emit(`-- Clim B 1: ${d1.length} rows, hourly, ${d1[0].ts} to ${d1[d1.length - 1].ts}`);
  emit(`-- Clim B 2: ${d2.length} rows, ~15min, ${d2[0].ts} to ${d2[d2.length - 1].ts}`);
  emit(`-- Generated: ${new Date().toISOString()}`);
  emit('-- ============================================================');
  emit();
  emit('BEGIN;');
  emit();
  emit('-- Create temporary table to hold time_series IDs for measurement inserts');
  emit('CREATE TEMP TABLE _import_ts_ids (');
  emit('  label TEXT PRIMARY KEY,');
  emit('  ts_id INT NOT NULL');
  emit(');');
  emit();

  // --- Device (single physical logger used at both points) ---
  emit('-- Fix all sequences to be past existing max IDs');
  emit(`SELECT setval('t_device_id_seq', (SELECT COALESCE(MAX(id), 0) FROM t_device));`);
  emit(`SELECT setval('t_sensor_configuration_id_seq', (SELECT COALESCE(MAX(id), 0) FROM t_sensor_configuration));`);
  emit(`SELECT setval('t_point_id_seq', (SELECT COALESCE(MAX(id), 0) FROM t_point));`);
  emit(`SELECT setval('t_observation_id_seq', (SELECT COALESCE(MAX(id), 0) FROM t_observation));`);
  emit(`SELECT setval('t_time_series_id_seq', (SELECT COALESCE(MAX(id), 0) FROM t_time_series));`);
  emit();
  emit('-- Device: the multi-parameter climate logger');
  emit(`INSERT INTO t_device (name, brand_name)`);
  emit(`  VALUES ('Cave ${CAVE_ID} Climate Logger', NULL);`);
  emit();

  // --- Sensor configurations (7 channels per point = 14 total) ---
  emit('-- Sensor configurations: one per quantity kind per deployment point');
  // Map: channel -> { quantity kind ID, unit ID }
  const channelConfigs = [
    { qk: QK.TEMP, unit: UNIT.CELSIUS },    // Temperature
    { qk: QK.HUM, unit: UNIT.PERCENT },     // Humidity
    { qk: QK.PRES, unit: UNIT.HPA },        // Pressure
    { qk: QK.DEW, unit: UNIT.CELSIUS },     // Dew Point
    { qk: QK.CO2, unit: UNIT.PPM },         // CO2
    { qk: QK.TEMP, unit: UNIT.CELSIUS },    // Temperature (secondary)
    { qk: QK.HUM, unit: UNIT.PERCENT },     // Humidity (secondary)
  ];

  emit(`DO $$`);
  emit(`DECLARE`);
  emit(`  v_device_id INT;`);
  emit(`  v_point_b1 INT;`);
  emit(`  v_point_b2 INT;`);
  emit(`  v_obs_b1 INT;`);
  emit(`  v_obs_b2 INT;`);
  emit(`  v_ts_id INT;`);
  emit(`BEGIN`);
  emit();
  emit(`  v_device_id := currval('t_device_id_seq');`);
  emit();

  // 14 sensor configurations (7 per point, same device)
  for (let i = 0; i < 14; i++) {
    const cfg = channelConfigs[i % 7];
    emit(`  INSERT INTO t_sensor_configuration (id_device, id_quantity_kind, id_unit)`);
    emit(`    VALUES (v_device_id, ${cfg.qk}, ${cfg.unit});`);
  }
  emit();

  // --- Points ---
  emit(`  -- Observation points`);
  emit(`  INSERT INTO t_point (id_author, date_inscription, label, id_cave, is_deleted)`);
  emit(`    VALUES (${AUTHOR_ID}, now(), 'Clim B 1', ${CAVE_ID}, false)`);
  emit(`    RETURNING id INTO v_point_b1;`);
  emit();
  emit(`  INSERT INTO t_point (id_author, date_inscription, label, id_cave, is_deleted)`);
  emit(`    VALUES (${AUTHOR_ID}, now(), 'Clim B 2', ${CAVE_ID}, false)`);
  emit(`    RETURNING id INTO v_point_b2;`);
  emit();

  // --- Observations (one per logger) ---
  emit(`  -- Observations`);
  emit(`  INSERT INTO t_observation (`);
  emit(`    id_author, date_inscription, observation_date, id_point, id_cave,`);
  emit(`    id_observation_type, observation_type_code, point_label, is_deleted`);
  emit(`  ) VALUES (`);
  emit(`    ${AUTHOR_ID}, now(), '${d1[0].ts}', v_point_b1, ${CAVE_ID},`);
  emit(`    ${OBS_TYPE_ID}, '${OBS_TYPE_CODE}', 'Clim B 1', false`);
  emit(`  ) RETURNING id INTO v_obs_b1;`);
  emit();
  emit(`  INSERT INTO t_observation (`);
  emit(`    id_author, date_inscription, observation_date, id_point, id_cave,`);
  emit(`    id_observation_type, observation_type_code, point_label, is_deleted`);
  emit(`  ) VALUES (`);
  emit(`    ${AUTHOR_ID}, now(), '${d2[0].ts}', v_point_b2, ${CAVE_ID},`);
  emit(`    ${OBS_TYPE_ID}, '${OBS_TYPE_CODE}', 'Clim B 2', false`);
  emit(`  ) RETURNING id INTO v_obs_b2;`);
  emit();

  // --- Time series (7 per logger = 14 total) ---
  // Channel definitions with stats
  const channels = [
    { field: 'temp', qkCode: 'Temperature', unitSym: '°C', mediumId: MEDIUM_AIR_ID, mediumCode: MEDIUM_AIR_CODE },
    { field: 'hum', qkCode: 'RelativeHumidity', unitSym: '%', mediumId: MEDIUM_AIR_ID, mediumCode: MEDIUM_AIR_CODE },
    { field: 'pres', qkCode: 'AtmosphericPressure', unitSym: 'hPa', mediumId: MEDIUM_AIR_ID, mediumCode: MEDIUM_AIR_CODE },
    { field: 'dew', qkCode: 'DewPointTemperature', unitSym: '°C', mediumId: MEDIUM_AIR_ID, mediumCode: MEDIUM_AIR_CODE },
    { field: 'co2', qkCode: 'CO2Concentration', unitSym: 'ppm', mediumId: MEDIUM_AIR_ID, mediumCode: MEDIUM_AIR_CODE },
    { field: 'temp2', qkCode: 'Temperature', unitSym: '°C', mediumId: MEDIUM_AIR_ID, mediumCode: MEDIUM_AIR_CODE },
    { field: 'hum2', qkCode: 'RelativeHumidity', unitSym: '%', mediumId: MEDIUM_AIR_ID, mediumCode: MEDIUM_AIR_CODE },
  ];

  const datasets = [
    { data: d1, label: 'b1', obsVar: 'v_obs_b1', interval: 3600, scOffset: 0 },
    { data: d2, label: 'b2', obsVar: 'v_obs_b2', interval: null, scOffset: 7 },
  ];

  emit(`  -- Time series`);
  for (const ds of datasets) {
    for (let i = 0; i < channels.length; i++) {
      const ch = channels[i];
      const st = fieldStats(ds.data, ch.field);
      const scIdx = ds.scOffset + i; // sensor_configuration offset from base
      const tsLabel = `${ds.label}_${ch.field}`;
      const startTs = ds.data[0].ts;
      const endTs = ds.data[ds.data.length - 1].ts;
      const interval = ds.interval ? ds.interval : 'NULL';
      const minVal = st.min !== null ? st.min : 'NULL';
      const maxVal = st.max !== null ? st.max : 'NULL';

      emit(`  INSERT INTO t_time_series (`);
      emit(`    id_author, date_inscription, id_observation, id_sensor_configuration,`);
      emit(`    id_medium, sampling_interval_seconds, start_date, end_date,`);
      emit(`    measurement_count, min_value, max_value, data_quality,`);
      emit(`    quantity_kind_code, unit_symbol, medium_code, is_deleted`);
      emit(`  ) VALUES (`);
      emit(`    ${AUTHOR_ID}, now(), ${ds.obsVar}, currval('t_sensor_configuration_id_seq') - ${13 - scIdx},`);
      emit(`    ${ch.mediumId}, ${interval}, '${startTs}', '${endTs}',`);
      emit(`    ${st.count}, ${minVal}, ${maxVal}, 'raw',`);
      emit(`    '${ch.qkCode}', '${ch.unitSym}', '${ch.mediumCode}', false`);
      emit(`  ) RETURNING id INTO v_ts_id;`);
      emit(`  INSERT INTO _import_ts_ids VALUES ('${tsLabel}', v_ts_id);`);
      emit();
    }
  }

  emit(`END $$;`);
  emit();

  // --- Measurements (bulk inserts outside DO block, referencing temp table) ---
  emit('-- ============================================================');
  emit('-- Measurements (bulk insert)');
  emit('-- ============================================================');
  emit();

  // Generate measurement inserts per channel per file
  // We batch in groups of 100 rows for readability
  const BATCH_SIZE = 100;

  for (const ds of datasets) {
    for (const ch of channels) {
      const tsLabel = `${ds.label}_${ch.field}`;
      const rows = ds.data.filter((r) => r[ch.field] != null && !isNaN(r[ch.field]));
      if (!rows.length) continue;

      emit(`-- ${tsLabel}: ${rows.length} measurements`);

      for (let batch = 0; batch < rows.length; batch += BATCH_SIZE) {
        const chunk = rows.slice(batch, batch + BATCH_SIZE);
        emit(`INSERT INTO t_measurement (id_time_series, value, value_si, timestamp)`);
        emit(`SELECT ts_id, v.value, v.value_si, v.ts FROM _import_ts_ids, (VALUES`);

        const valueLines = chunk.map((r, idx) => {
          const val = r[ch.field];
          let valueSi;
          switch (ch.field) {
            case 'temp':
            case 'temp2':
            case 'dew':
              valueSi = toK(val); break;
            case 'pres':
              valueSi = toPa(val); break;
            case 'hum':
            case 'hum2':
              valueSi = toFrac(val); break;
            case 'co2':
              valueSi = toMolMol(val); break;
            default:
              valueSi = val;
          }
          const comma = idx < chunk.length - 1 ? ',' : '';
          return `  (${val}::numeric, ${valueSi}::numeric, '${r.ts}'::timestamptz)${comma}`;
        });

        for (const line of valueLines) emit(line);
        emit(`) AS v(value, value_si, ts)`);
        emit(`WHERE _import_ts_ids.label = '${tsLabel}';`);
        emit();
      }
    }
  }

  // Cleanup
  emit('-- Cleanup temp table');
  emit('DROP TABLE _import_ts_ids;');
  emit();
  emit('COMMIT;');
  emit();
  emit('-- Done. Verify with:');
  emit(`-- SELECT ts.id, ts.quantity_kind_code, ts.unit_symbol, ts.measurement_count`);
  emit(`-- FROM t_time_series ts`);
  emit(`-- JOIN t_observation o ON o.id = ts.id_observation`);
  emit(`-- WHERE o.id_cave = ${CAVE_ID};`);

  // Output
  process.stdout.write(o.join('\n') + '\n');
}

main();
