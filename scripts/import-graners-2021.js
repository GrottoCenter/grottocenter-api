#!/usr/bin/env node

/**
 * Import script for Cueva de los Graners (Cottellia) 2021 observatory data.
 *
 * Reads raw sensor files from data/documents/147251/ and generates a SQL file
 * that inserts:
 *   - 3 t_point records (Graners-1, Armeña AIR, Armeña SOL)
 *   - 1 t_observation record (2021 campaign)
 *   - 10 t_time_series records
 *   - ~92k t_measurement records
 *
 * Usage:
 *   node scripts/import-graners-2021.js > sql/9_06_2026_05_28_graners_2021_data.sql
 */

'use strict';

const fs = require('fs');
const path = require('path');

// === Configuration ===

const DATA_DIR = path.join(__dirname, '..', 'data', 'documents', '147251');
const AUTHOR_ID = parseInt(process.env.AUTHOR_ID || '11590', 10); // GAYET Jean-Claude (override with env var for local dev)
const CAVE_ID = null; // Will use entrance 88044's cave — set at runtime or leave NULL for local dev
const ENTRANCE_ID = 88044;

// Coordinates from the entrance record
const LAT = 42.525126;
const LON = 0.240361;

// Observation date (publication year)
const OBSERVATION_DATE = '2021-01-01T00:00:00Z';

// Sensor configuration IDs (from seed data)
const CONFIG = {
  SU_14608_LEVEL: 5,
  SU_14608_TEMP: 6,
  SU_11436_LEVEL: 7,
  SU_11436_TEMP: 8,
  PLUVIO_AIR: 9,
  PLUVIO_SOL: 10,
  HOBO_TEMP: 11,
  HOBO_HUMIDITY: 12,
  HOBO_DEWPOINT: 13,
  GROUND_TEMP: 14,
};

// Medium IDs
const MEDIUM = {
  WATER: 1,
  AIR: 2,
  SOIL: 3,
};

// === File lists ===

const SU_14608_FILES = [
  '210311-0821-177-14608.csv',
  '210323-0544-178-14608.csv',
  '210412-0230-179-14608.csv',
  '210420-0441-181-14608.csv',
  '210422-2304-182-14608.csv',
  '210617-1643-183-14608.csv',
  '210623-2320-184-14608.csv',
  '210804-1721-185-14608.csv',
  '210901-2037-186-14608.csv',
  '210914-1336-187-14608.csv',
  '210925-1947-188-14608.csv',
  '211003-1723-189-14608.csv',
  '211030-0457-190-14608.csv',
  '211208-1336-191-14608.csv',
  '211210-1443-192-14608.csv',
  '211215-0606-193-14608.csv',
  '211227-1911-194-14608.csv',
  '220111-0058-195-14608.csv',
  '210305-0437-176-14608.csv',
  '210416-0604-180-1408.csv', // filename says 1408 but data says SU-14608
];

const SU_11436_FILES = [
  '210122-1847-170-11436.csv',
  '210128-0204-171-11436.csv',
  '210202-0750-172-11436.csv',
  '210203-0620-173-11436.csv',
  '210213-0416-174-11436.csv',
  '210222-1505-175-11436.csv',
];

// === Parsers ===

/**
 * Parse a Paratronic SU CSV file.
 * Format: type,sensor_id,serial,year,month,day,hour,min,sec,elapsed_seconds,distance_mm,temp_int,temp_dec
 *
 * The last two fields (temp_int,temp_dec) form a single decimal value with European comma:
 *   "279,93" → 279.93 K
 *
 * Returns: { levelMeasurements: [{timestamp, value}], tempMeasurements: [{timestamp, value, valueSi}] }
 */
function parseSuCsv(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n');

  const levelMeasurements = [];
  const tempMeasurements = [];

  for (const line of lines) {
    const parts = line.trim().split(',');
    if (parts.length < 13) continue;

    // parts: [type, sensorId, serial, year, month, day, hour, min, sec, elapsed, distance, tempInt, tempDec]
    const year = parseInt(parts[3], 10);
    const month = parseInt(parts[4], 10);
    const day = parseInt(parts[5], 10);
    const hour = parseInt(parts[6], 10);
    const min = parseInt(parts[7], 10);
    const sec = parseInt(parts[8], 10);
    const elapsedSeconds = parseInt(parts[9], 10);

    const distanceMm = parseInt(parts[10], 10);
    const tempKelvin = parseFloat(`${parts[11]}.${parts[12]}`);

    // Base timestamp + elapsed seconds
    const baseDate = new Date(Date.UTC(year, month - 1, day, hour, min, sec));
    const timestamp = new Date(baseDate.getTime() + elapsedSeconds * 1000);

    if (!isNaN(distanceMm)) {
      levelMeasurements.push({
        timestamp: timestamp.toISOString(),
        value: distanceMm,
        valueSi: distanceMm / 1000, // mm → m (SI for length)
      });
    }

    if (!isNaN(tempKelvin)) {
      tempMeasurements.push({
        timestamp: timestamp.toISOString(),
        value: tempKelvin,
        valueSi: tempKelvin, // Already in Kelvin (SI)
      });
    }
  }

  return { levelMeasurements, tempMeasurements };
}

/**
 * Parse a HOBO Pendant Event (pluviometer) TXT file.
 * Format:
 *   Header: "name,Time,Event(Rising),Serial Number"
 *   Row 0: "0,timestamp,,serial" (initialization row)
 *   Row N: "N,timestamp,1" (event)
 *
 * Returns: [{timestamp, value: 1}]
 */
function parsePluvioTxt(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n');
  const measurements = [];

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',');
    if (parts.length < 3) continue;

    const idx = parseInt(parts[0], 10);
    if (idx === 0) continue; // initialization row

    const timestamp = parts[1].trim();
    const event = parts[2].trim();

    if (event === '1' && timestamp) {
      // Parse "2020-09-11 08:44:43.7" format
      const ts = parseHoboTimestamp(timestamp);
      if (ts) {
        measurements.push({ timestamp: ts, value: 1, valueSi: 1 });
      }
    }
  }

  return measurements;
}

/**
 * Parse a HOBO U23 temperature/humidity TXT file.
 * Format:
 *   Header: "name,Time,Celsius(°C),Humidity(%rh),Dew Point(°C),Serial Number"
 *   Row N: "N,timestamp,temp,humidity,dewpoint[,serial]"
 *
 * Returns: { tempMeasurements, humidityMeasurements, dewPointMeasurements }
 */
function parseHoboTempHumidity(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n');

  const tempMeasurements = [];
  const humidityMeasurements = [];
  const dewPointMeasurements = [];

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',');
    if (parts.length < 4) continue;

    const timestamp = parts[1].trim();
    const temp = parseFloat(parts[2]);
    const humidity = parseFloat(parts[3]);
    const dewPoint = parts.length >= 5 ? parseFloat(parts[4]) : NaN;

    const ts = parseHoboTimestamp(timestamp);
    if (!ts) continue;

    if (!isNaN(temp)) {
      tempMeasurements.push({
        timestamp: ts,
        value: temp,
        valueSi: temp + 273.15, // °C → K
      });
    }

    if (!isNaN(humidity)) {
      humidityMeasurements.push({
        timestamp: ts,
        value: humidity,
        valueSi: humidity / 100, // % → fraction (SI for dimensionless ratio)
      });
    }

    if (!isNaN(dewPoint)) {
      dewPointMeasurements.push({
        timestamp: ts,
        value: dewPoint,
        valueSi: dewPoint + 273.15, // °C → K
      });
    }
  }

  return { tempMeasurements, humidityMeasurements, dewPointMeasurements };
}

/**
 * Parse a HOBO temperature-only TXT file (SOL-PRO).
 * Format:
 *   Header: "name,Time,Celsius(°C),Serial Number"
 *   Row N: "N,timestamp,temp[,serial]"
 *
 * Returns: [{timestamp, value, valueSi}]
 */
function parseHoboTemp(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n');
  const measurements = [];

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',');
    if (parts.length < 3) continue;

    const timestamp = parts[1].trim();
    const temp = parseFloat(parts[2]);

    const ts = parseHoboTimestamp(timestamp);
    if (!ts || isNaN(temp)) continue;

    measurements.push({
      timestamp: ts,
      value: temp,
      valueSi: temp + 273.15, // °C → K
    });
  }

  return measurements;
}

/**
 * Parse HOBO timestamp format: "2020-09-11 08:44:43.7" or "2020-09-11 09:00:00"
 * Assumes Europe/Paris timezone (UTC+1 in winter, UTC+2 in summer).
 * We store as UTC — apply +1/+2 offset based on date.
 *
 * For simplicity, we'll store the raw timestamp as-is and note the timezone
 * on the time_series record. The BI layer handles display conversion.
 *
 * Actually, per the BI docs: "enforce TIMESTAMPTZ and require all ingested data
 * to be converted to UTC at import time."
 *
 * We'll assume CET/CEST (Europe/Madrid for Aragón, Spain — same as Europe/Paris).
 * CET = UTC+1 (last Sunday of October → last Sunday of March)
 * CEST = UTC+2 (last Sunday of March → last Sunday of October)
 */
function parseHoboTimestamp(str) {
  if (!str) return null;
  // "2020-09-11 08:44:43.7" or "2020-09-11 09:00:00"
  const match = str.match(
    /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?$/
  );
  if (!match) return null;

  const [, y, mo, d, h, mi, s, frac] = match;
  const year = parseInt(y, 10);
  const month = parseInt(mo, 10);
  const day = parseInt(d, 10);
  const hour = parseInt(h, 10);
  const minute = parseInt(mi, 10);
  const second = parseInt(s, 10);
  const ms = frac ? parseInt(frac.padEnd(3, '0').slice(0, 3), 10) : 0;

  // Determine if DST (CEST) applies for Europe/Madrid
  const isDst = isEuropeDst(year, month, day, hour);
  const offsetHours = isDst ? 2 : 1;

  // Create UTC timestamp by subtracting the offset
  const localMs = Date.UTC(year, month - 1, day, hour, minute, second, ms);
  const utcMs = localMs - offsetHours * 3600000;

  return new Date(utcMs).toISOString();
}

/**
 * Determine if a given local date/time falls in European Summer Time (CEST).
 * DST starts: last Sunday of March at 02:00 local → 03:00
 * DST ends: last Sunday of October at 03:00 local → 02:00
 */
function isEuropeDst(year, month, day, hour) {
  if (month > 3 && month < 10) return true;
  if (month < 3 || month > 10) return false;

  // March: DST starts on last Sunday at 02:00
  if (month === 3) {
    const lastSunday = getLastSundayOfMonth(year, 3);
    if (day > lastSunday) return true;
    if (day < lastSunday) return false;
    return hour >= 2;
  }

  // October: DST ends on last Sunday at 03:00
  if (month === 10) {
    const lastSunday = getLastSundayOfMonth(year, 10);
    if (day < lastSunday) return true;
    if (day > lastSunday) return false;
    return hour < 3;
  }

  return false;
}

function getLastSundayOfMonth(year, month) {
  // Day of last day of month
  const lastDay = new Date(year, month, 0).getDate();
  const lastDayOfWeek = new Date(year, month - 1, lastDay).getDay(); // 0=Sunday
  return lastDay - lastDayOfWeek;
}

// === SQL Generation ===

function escapeSql(str) {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

function numOrNull(val) {
  if (val === null || val === undefined || isNaN(val)) return 'NULL';
  return val;
}

function generateSql() {
  const out = [];

  out.push('\\c grottoce;');
  out.push('');
  out.push(
    '-- ============================================================'
  );
  out.push(
    '-- Cueva de los Graners (Cottellia) — 2021 Observatory Data'
  );
  out.push('-- Source: Document 147251 (GrottoCenter)');
  out.push('-- Author: GAYET Jean-Claude (caver 11590)');
  out.push(
    '-- ============================================================'
  );
  out.push('');
  out.push('BEGIN;');
  out.push('');

  // --- Partitions ---
  // Create partitions for the date range covered by this data (2020-Q3 to 2022-Q1)
  out.push('-- Ensure measurement partitions exist for the data range');
  out.push(
    "CREATE TABLE IF NOT EXISTS t_measurement_2020_q3 PARTITION OF t_measurement FOR VALUES FROM ('2020-07-01') TO ('2020-10-01');"
  );
  out.push(
    "CREATE TABLE IF NOT EXISTS t_measurement_2020_q4 PARTITION OF t_measurement FOR VALUES FROM ('2020-10-01') TO ('2021-01-01');"
  );
  out.push(
    "CREATE TABLE IF NOT EXISTS t_measurement_2021_q1 PARTITION OF t_measurement FOR VALUES FROM ('2021-01-01') TO ('2021-04-01');"
  );
  out.push(
    "CREATE TABLE IF NOT EXISTS t_measurement_2021_q2 PARTITION OF t_measurement FOR VALUES FROM ('2021-04-01') TO ('2021-07-01');"
  );
  out.push(
    "CREATE TABLE IF NOT EXISTS t_measurement_2021_q3 PARTITION OF t_measurement FOR VALUES FROM ('2021-07-01') TO ('2021-10-01');"
  );
  out.push(
    "CREATE TABLE IF NOT EXISTS t_measurement_2021_q4 PARTITION OF t_measurement FOR VALUES FROM ('2021-10-01') TO ('2022-01-01');"
  );
  out.push(
    "CREATE TABLE IF NOT EXISTS t_measurement_2022_q1 PARTITION OF t_measurement FOR VALUES FROM ('2022-01-01') TO ('2022-04-01');"
  );
  out.push('');

  // --- Points ---
  out.push('-- Observation points');
  out.push(
    "INSERT INTO t_point (id_author, date_inscription, label, latitude, longitude, point_geom, id_cave) VALUES"
  );
  out.push(
    `  (${AUTHOR_ID}, now(), 'Graners-1', ${LAT}, ${LON}, ST_SetSRID(ST_MakePoint(${LON}, ${LAT}), 4326), (SELECT id_cave FROM t_entrance WHERE id = ${ENTRANCE_ID})),`
  );
  out.push(
    `  (${AUTHOR_ID}, now(), 'Armeña AIR', ${LAT}, ${LON}, ST_SetSRID(ST_MakePoint(${LON}, ${LAT}), 4326), NULL),`
  );
  out.push(
    `  (${AUTHOR_ID}, now(), 'Armeña SOL', ${LAT}, ${LON}, ST_SetSRID(ST_MakePoint(${LON}, ${LAT}), 4326), NULL);`
  );
  out.push('');

  // --- Observation ---
  // One observation per point (so each point's label appears correctly in the BI view)
  out.push('-- Observations (2021 monitoring campaign — one per point)');
  out.push(
    "INSERT INTO t_observation (id_author, date_inscription, observation_date, id_point, id_cave, id_observation_type, observation_type_code, point_label, latitude, longitude) VALUES"
  );
  out.push(
    `  (${AUTHOR_ID}, now(), '${OBSERVATION_DATE}', (SELECT id FROM t_point WHERE label = 'Graners-1' AND id_author = ${AUTHOR_ID} ORDER BY id DESC LIMIT 1), (SELECT id_cave FROM t_entrance WHERE id = ${ENTRANCE_ID}), 2, 'physical_measurements', 'Graners-1', ${LAT}, ${LON}),`
  );
  out.push(
    `  (${AUTHOR_ID}, now(), '${OBSERVATION_DATE}', (SELECT id FROM t_point WHERE label = 'Armeña AIR' AND id_author = ${AUTHOR_ID} ORDER BY id DESC LIMIT 1), NULL, 2, 'physical_measurements', 'Armeña AIR', ${LAT}, ${LON}),`
  );
  out.push(
    `  (${AUTHOR_ID}, now(), '${OBSERVATION_DATE}', (SELECT id FROM t_point WHERE label = 'Armeña SOL' AND id_author = ${AUTHOR_ID} ORDER BY id DESC LIMIT 1), NULL, 2, 'physical_measurements', 'Armeña SOL', ${LAT}, ${LON});`
  );
  out.push('');

  // --- Parse all files ---
  process.stderr.write('Parsing SU-14608 files...\n');
  const su14608 = { level: [], temp: [] };
  for (const file of SU_14608_FILES) {
    const filePath = path.join(DATA_DIR, file);
    const { levelMeasurements, tempMeasurements } = parseSuCsv(filePath);
    su14608.level.push(...levelMeasurements);
    su14608.temp.push(...tempMeasurements);
    process.stderr.write(
      `  ${file}: ${levelMeasurements.length} level, ${tempMeasurements.length} temp\n`
    );
  }

  process.stderr.write('Parsing SU-11436 files...\n');
  const su11436 = { level: [], temp: [] };
  for (const file of SU_11436_FILES) {
    const filePath = path.join(DATA_DIR, file);
    const { levelMeasurements, tempMeasurements } = parseSuCsv(filePath);
    su11436.level.push(...levelMeasurements);
    su11436.temp.push(...tempMeasurements);
    process.stderr.write(
      `  ${file}: ${levelMeasurements.length} level, ${tempMeasurements.length} temp\n`
    );
  }

  process.stderr.write('Parsing pluviometer files...\n');
  const pluvioAir = parsePluvioTxt(
    path.join(DATA_DIR, '210625_PL_Armeña-AIR.txt')
  );
  process.stderr.write(`  PL Armeña-AIR: ${pluvioAir.length} events\n`);

  const pluvioSol = parsePluvioTxt(
    path.join(DATA_DIR, '210625_Armena PLSOL.txt')
  );
  process.stderr.write(`  Armena PLSOL: ${pluvioSol.length} events\n`);

  process.stderr.write('Parsing HOBO temp/humidity file...\n');
  const hoboTH = parseHoboTempHumidity(
    path.join(DATA_DIR, 'rh-°c_ArmeñaAIR.txt')
  );
  process.stderr.write(
    `  rh-°c ArmeñaAIR: ${hoboTH.tempMeasurements.length} temp, ${hoboTH.humidityMeasurements.length} humidity, ${hoboTH.dewPointMeasurements.length} dew point\n`
  );

  process.stderr.write('Parsing HOBO ground temp file...\n');
  const groundTemp = parseHoboTemp(
    path.join(DATA_DIR, 'Th--SOL-PRO_n°2.txt')
  );
  process.stderr.write(`  Th--SOL-PRO n°2: ${groundTemp.length} readings\n`);

  // --- Time Series ---
  // We'll define them in order and use currval to reference IDs

  const timeSeries = [
    {
      name: 'SU-14608 water level',
      configId: CONFIG.SU_14608_LEVEL,
      mediumId: MEDIUM.WATER,
      pointLabel: 'Graners-1',
      samplingInterval: 600,
      quantityKindCode: 'WaterLevel',
      unitSymbol: 'mm',
      mediumCode: 'water',
      timezone: 'Europe/Madrid',
      measurements: su14608.level,
    },
    {
      name: 'SU-14608 temperature',
      configId: CONFIG.SU_14608_TEMP,
      mediumId: MEDIUM.WATER,
      pointLabel: 'Graners-1',
      samplingInterval: 600,
      quantityKindCode: 'Temperature',
      unitSymbol: 'K',
      mediumCode: 'water',
      timezone: 'Europe/Madrid',
      measurements: su14608.temp,
    },
    {
      name: 'SU-11436 water level',
      configId: CONFIG.SU_11436_LEVEL,
      mediumId: MEDIUM.WATER,
      pointLabel: 'Graners-1',
      samplingInterval: 600,
      quantityKindCode: 'WaterLevel',
      unitSymbol: 'mm',
      mediumCode: 'water',
      timezone: 'Europe/Madrid',
      measurements: su11436.level,
    },
    {
      name: 'SU-11436 temperature',
      configId: CONFIG.SU_11436_TEMP,
      mediumId: MEDIUM.WATER,
      pointLabel: 'Graners-1',
      samplingInterval: 600,
      quantityKindCode: 'Temperature',
      unitSymbol: 'K',
      mediumCode: 'water',
      timezone: 'Europe/Madrid',
      measurements: su11436.temp,
    },
    {
      name: 'Pluviometer AIR',
      configId: CONFIG.PLUVIO_AIR,
      mediumId: MEDIUM.AIR,
      pointLabel: 'Armeña AIR',
      samplingInterval: null, // irregular
      quantityKindCode: 'Precipitation',
      unitSymbol: 'count',
      mediumCode: 'air',
      timezone: 'Europe/Madrid',
      measurements: pluvioAir,
    },
    {
      name: 'Pluviometer SOL',
      configId: CONFIG.PLUVIO_SOL,
      mediumId: MEDIUM.SOIL,
      pointLabel: 'Armeña SOL',
      samplingInterval: null, // irregular
      quantityKindCode: 'Precipitation',
      unitSymbol: 'count',
      mediumCode: 'soil',
      timezone: 'Europe/Madrid',
      measurements: pluvioSol,
    },
    {
      name: 'Air temperature (Armeña)',
      configId: CONFIG.HOBO_TEMP,
      mediumId: MEDIUM.AIR,
      pointLabel: 'Armeña AIR',
      samplingInterval: 3600,
      quantityKindCode: 'Temperature',
      unitSymbol: '°C',
      mediumCode: 'air',
      timezone: 'Europe/Madrid',
      measurements: hoboTH.tempMeasurements,
    },
    {
      name: 'Relative humidity (Armeña)',
      configId: CONFIG.HOBO_HUMIDITY,
      mediumId: MEDIUM.AIR,
      pointLabel: 'Armeña AIR',
      samplingInterval: 3600,
      quantityKindCode: 'RelativeHumidity',
      unitSymbol: '%',
      mediumCode: 'air',
      timezone: 'Europe/Madrid',
      measurements: hoboTH.humidityMeasurements,
    },
    {
      name: 'Dew point (Armeña)',
      configId: CONFIG.HOBO_DEWPOINT,
      mediumId: MEDIUM.AIR,
      pointLabel: 'Armeña AIR',
      samplingInterval: 3600,
      quantityKindCode: 'DewPointTemperature',
      unitSymbol: '°C',
      mediumCode: 'air',
      timezone: 'Europe/Madrid',
      measurements: hoboTH.dewPointMeasurements,
    },
    {
      name: 'Ground temperature (Armeña SOL-PRO)',
      configId: CONFIG.GROUND_TEMP,
      mediumId: MEDIUM.SOIL,
      pointLabel: 'Armeña SOL',
      samplingInterval: 3600,
      quantityKindCode: 'Temperature',
      unitSymbol: '°C',
      mediumCode: 'soil',
      timezone: 'Europe/Madrid',
      measurements: groundTemp,
    },
  ];

  // --- Generate time series + measurements SQL ---
  out.push('-- Time series and measurements');
  out.push('');

  let totalMeasurements = 0;

  for (let i = 0; i < timeSeries.length; i++) {
    const ts = timeSeries[i];
    const measurements = ts.measurements;

    if (measurements.length === 0) {
      process.stderr.write(`  WARNING: No measurements for "${ts.name}", skipping.\n`);
      continue;
    }

    // Sort by timestamp
    measurements.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

    const startDate = measurements[0].timestamp;
    const endDate = measurements[measurements.length - 1].timestamp;
    const values = measurements.map((m) => m.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);

    out.push(`-- Time series: ${ts.name} (${measurements.length} measurements)`);
    out.push(
      `INSERT INTO t_time_series (id_author, date_inscription, id_observation, id_sensor_configuration, id_medium, sampling_interval_seconds, start_date, end_date, measurement_count, min_value, max_value, data_quality, quantity_kind_code, unit_symbol, medium_code, timezone_offset) VALUES`
    );
    out.push(
      `  (${AUTHOR_ID}, now(), (SELECT id FROM t_observation WHERE observation_date = '${OBSERVATION_DATE}' AND id_author = ${AUTHOR_ID} AND point_label = '${ts.pointLabel}' ORDER BY id DESC LIMIT 1), ${ts.configId}, ${ts.mediumId}, ${numOrNull(ts.samplingInterval)}, '${startDate}', '${endDate}', ${measurements.length}, ${minVal}, ${maxVal}, 'raw', '${ts.quantityKindCode}', '${ts.unitSymbol}', '${ts.mediumCode}', '${ts.timezone}');`
    );
    out.push('');

    // Insert measurements in batches of 1000
    const BATCH_SIZE = 1000;
    out.push(
      `INSERT INTO t_measurement (id_time_series, value, value_si, timestamp) VALUES`
    );

    const measurementLines = [];
    for (const m of measurements) {
      measurementLines.push(
        `  (currval('t_time_series_id_seq'), ${m.value}, ${numOrNull(m.valueSi)}, '${m.timestamp}')`
      );
    }
    out.push(measurementLines.join(',\n') + ';');
    out.push('');

    totalMeasurements += measurements.length;
    process.stderr.write(
      `  ${ts.name}: ${measurements.length} measurements (${startDate} → ${endDate})\n`
    );
  }

  out.push('COMMIT;');
  out.push('');
  out.push(
    `-- Total: ${totalMeasurements} measurements across ${timeSeries.length} time series`
  );

  process.stderr.write(`\nTotal: ${totalMeasurements} measurements\n`);

  return out.join('\n');
}

// === Main ===
const sql = generateSql();
process.stdout.write(sql);
