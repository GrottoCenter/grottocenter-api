/**
 * TimestampConverter service for the scientific data import pipeline.
 *
 * Parses timestamp string values from parsed rows and converts them to UTC
 * Date objects using the profile's date format and IANA timezone.
 *
 * Supports four modes:
 *   - "datetime": a single column contains both date and time
 *   - "dateOnly" + "timeOnly": two separate columns combined at parse time
 *   - "components": individual year/month/day/hour/minute/second columns
 *   - "epoch": a standalone elapsed_seconds column interpreted as Unix epoch
 *
 * Additionally, an elapsed_seconds column can be combined with any of the
 * first three modes, adding an offset (in seconds) to the base timestamp.
 *
 * This is a pure synchronous function — no DB access, no side effects.
 */

const dayjs = require('../../utils/dayjs');

// Component timestamp types that together form a full timestamp
const COMPONENT_TYPES = [
  'year',
  'month',
  'day',
  'hour',
  'minute',
  'second',
  'elapsed_seconds',
];

/**
 * Parses and converts timestamp strings to UTC Date objects.
 *
 * @param {string[][]} rows - Parsed data rows (arrays of string values)
 * @param {Object} profile - Profile with timezone, dateFormat, dateOnlyFormat,
 *   timeOnlyFormat, and columnMappings
 * @param {number[]} columnIndices - Original column indices present in rows
 *   (after excluded-column filtering). Used to map columnIndex → row position.
 * @returns {Date[]} Array of UTC Date objects, one per row
 * @throws {Error} with row number and raw value on parse failure
 * @throws {Error} on dateOnly/timeOnly column pairing issues
 */
const convert = (rows, profile, columnIndices) => {
  const {
    timezone,
    dateFormat,
    dateOnlyFormat,
    timeOnlyFormat,
    columnMappings = [],
  } = profile;

  // -------------------------------------------------------------------------
  // 1. Identify timestamp columns from columnMappings where role === 'timestamp'
  // -------------------------------------------------------------------------
  const timestampMappings = columnMappings.filter(
    (m) => m.role === 'timestamp'
  );

  // Find the column mapping(s) by timestampType
  const datetimeMapping = timestampMappings.find(
    (m) => m.timestampType === 'datetime'
  );
  const dateOnlyMapping = timestampMappings.find(
    (m) => m.timestampType === 'dateOnly'
  );
  const timeOnlyMapping = timestampMappings.find(
    (m) => m.timestampType === 'timeOnly'
  );

  // Component-based mappings (year, month, day, hour, minute, second)
  const componentMappings = timestampMappings.filter(
    (m) =>
      COMPONENT_TYPES.includes(m.timestampType) &&
      m.timestampType !== 'elapsed_seconds'
  );

  // elapsed_seconds can be combined with any mode
  const elapsedSecondsMapping = timestampMappings.find(
    (m) => m.timestampType === 'elapsed_seconds'
  );

  // -------------------------------------------------------------------------
  // 3.6. Validate pairing: dateOnly requires timeOnly and vice versa
  // -------------------------------------------------------------------------
  if (dateOnlyMapping && !timeOnlyMapping) {
    throw new Error(
      `Timestamp column pairing error: found a 'dateOnly' column (index ${dateOnlyMapping.columnIndex}) but no corresponding 'timeOnly' column in columnMappings.`
    );
  }
  if (timeOnlyMapping && !dateOnlyMapping) {
    throw new Error(
      `Timestamp column pairing error: found a 'timeOnly' column (index ${timeOnlyMapping.columnIndex}) but no corresponding 'dateOnly' column in columnMappings.`
    );
  }

  // -------------------------------------------------------------------------
  // 2. Helper: resolve the row position for a given original columnIndex
  //
  //    Because excluded columns were filtered out, the position of a column in
  //    rows[i] is the index of columnIndex within the columnIndices array.
  // -------------------------------------------------------------------------
  const findPosition = (columnIndex) => {
    const pos = columnIndices.indexOf(columnIndex);
    if (pos === -1) {
      throw new Error(
        `Column index ${columnIndex} not found in columnIndices array.`
      );
    }
    return pos;
  };

  // -------------------------------------------------------------------------
  // Pre-compute positions (fail fast before iterating rows)
  // -------------------------------------------------------------------------
  let mode; // 'datetime' | 'split' | 'components' | 'epoch'
  let datetimePos;
  let dateOnlyPos;
  let timeOnlyPos;
  let componentPositions; // Map<timestampType → row position>
  let elapsedSecondsPos = null;

  // elapsed_seconds position is resolved independently — works with any mode
  if (elapsedSecondsMapping) {
    elapsedSecondsPos = findPosition(elapsedSecondsMapping.columnIndex);
  }

  if (datetimeMapping) {
    mode = 'datetime';
    datetimePos = findPosition(datetimeMapping.columnIndex);
  } else if (dateOnlyMapping && timeOnlyMapping) {
    mode = 'split';
    dateOnlyPos = findPosition(dateOnlyMapping.columnIndex);
    timeOnlyPos = findPosition(timeOnlyMapping.columnIndex);
  } else if (componentMappings.length > 0) {
    mode = 'components';
    // Validate that at least year, month, day are present
    const componentTypes = new Set(
      componentMappings.map((m) => m.timestampType)
    );
    const requiredComponents = ['year', 'month', 'day'];
    const missingComponents = requiredComponents.filter(
      (c) => !componentTypes.has(c)
    );
    if (missingComponents.length > 0) {
      throw new Error(
        `Component-based timestamps require at least year, month, and day columns. Missing: ${missingComponents.join(', ')}.`
      );
    }
    // Pre-compute positions for each component type
    componentPositions = new Map();
    componentMappings.forEach((m) => {
      componentPositions.set(m.timestampType, findPosition(m.columnIndex));
    });
  } else if (elapsedSecondsPos !== null) {
    // elapsed_seconds alone → Unix epoch seconds
    mode = 'epoch';
  } else {
    throw new Error(
      'No timestamp column found in columnMappings. At least one column with role "timestamp" is required.'
    );
  }

  // -------------------------------------------------------------------------
  // 3.2–3.5. Parse each row
  // -------------------------------------------------------------------------
  return rows.map((row, rowIndex) => {
    let m;

    if (mode === 'datetime') {
      // 3.2. Parse datetime column
      const rawValue = row[datetimePos];
      try {
        // Validate format in UTC to avoid local-timezone DST gaps
        // rejecting otherwise valid timestamps (e.g. 02:00 during a
        // spring-forward gap on the server's local clock).
        if (!dayjs.utc(rawValue, dateFormat, true).isValid()) {
          m = null;
        } else {
          m = dayjs.tz(rawValue, dateFormat, timezone);
        }
      } catch {
        m = null;
      }

      if (!m || !m.isValid()) {
        // 3.5. Stop at first unparseable row — 1-based row number
        throw new Error(
          `Failed to parse timestamp at row ${rowIndex + 1}: '${rawValue}' does not match format '${dateFormat}'.`
        );
      }
    } else if (mode === 'split') {
      // 3.3. Combine dateOnly + timeOnly columns
      const dateValue = row[dateOnlyPos];
      const timeValue = row[timeOnlyPos];
      const combined = `${dateValue} ${timeValue}`;
      const combinedFormat = `${dateOnlyFormat} ${timeOnlyFormat}`;
      try {
        // Validate format in UTC to avoid local-timezone DST gaps
        // rejecting otherwise valid timestamps.
        if (!dayjs.utc(combined, combinedFormat, true).isValid()) {
          m = null;
        } else {
          m = dayjs.tz(combined, combinedFormat, timezone);
        }
      } catch {
        m = null;
      }

      if (!m || !m.isValid()) {
        throw new Error(
          `Failed to parse timestamp at row ${rowIndex + 1}: combined value '${combined}' does not match format '${combinedFormat}'.`
        );
      }
    } else if (mode === 'epoch') {
      // 3.9. Standalone elapsed_seconds → Unix epoch seconds
      const raw = row[elapsedSecondsPos];
      const epochSeconds = Number(raw);
      if (!Number.isInteger(epochSeconds)) {
        throw new Error(
          `Failed to parse Unix epoch seconds at row ${rowIndex + 1}: '${raw}' is not a valid integer.`
        );
      }
      m = dayjs.unix(epochSeconds);
      if (!m.isValid()) {
        throw new Error(
          `Failed to parse Unix epoch seconds at row ${rowIndex + 1}: '${raw}' produces an invalid date.`
        );
      }
      // Reject absurd dates (before 1900 or after 2100) — catches out-of-range
      // epoch values like 1e15 that pass Number.isInteger but produce nonsensical dates.
      const epochYear = m.year();
      if (epochYear < 1900 || epochYear > 2100) {
        throw new Error(
          `Failed to parse Unix epoch seconds at row ${rowIndex + 1}: '${raw}' produces year ${epochYear}, which is outside the accepted range (1900–2100).`
        );
      }
    } else {
      // 3.7. Component-based timestamp assembly
      const getComponent = (type, defaultValue) => {
        if (!componentPositions.has(type)) return defaultValue;
        const raw = row[componentPositions.get(type)];
        const parsed = parseInt(raw, 10);
        if (Number.isNaN(parsed)) {
          throw new Error(
            `Failed to parse timestamp component '${type}' at row ${rowIndex + 1}: '${raw}' is not a valid integer.`
          );
        }
        return parsed;
      };

      const year = getComponent('year', 0);
      const month = getComponent('month', 1);
      const day = getComponent('day', 1);
      const hour = getComponent('hour', 0);
      const minute = getComponent('minute', 0);
      const second = getComponent('second', 0);

      // Construct base timestamp in the profile timezone.
      // No strict pre-check here: the format is guaranteed correct by
      // construction (padded integers). dayjs.tz handles DST gaps by
      // choosing the post-transition offset for nonexistent local times.
      const isoStr = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
      try {
        m = dayjs.tz(isoStr, 'YYYY-MM-DD HH:mm:ss', timezone);
      } catch {
        m = null;
      }

      if (!m || !m.isValid()) {
        throw new Error(
          `Failed to parse timestamp at row ${rowIndex + 1}: components year=${year}, month=${month}, day=${day}, hour=${hour}, minute=${minute}, second=${second} do not form a valid date.`
        );
      }
    }

    // 3.8. Add elapsed_seconds offset (applies to any mode except epoch)
    if (mode !== 'epoch' && elapsedSecondsPos !== null) {
      const raw = row[elapsedSecondsPos];
      const elapsedSeconds = Number(raw);
      if (!Number.isInteger(elapsedSeconds)) {
        throw new Error(
          `Failed to parse elapsed_seconds at row ${rowIndex + 1}: '${raw}' is not a valid integer.`
        );
      }
      if (elapsedSeconds !== 0) {
        m = m.add(elapsedSeconds, 'second');
      }
    }

    // 3.4. Convert to UTC — m.toDate() returns a UTC Date object
    return m.toDate();
  });
};

module.exports = { convert, COMPONENT_TYPES };
