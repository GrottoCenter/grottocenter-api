const { COMPONENT_TYPES } = require('./TimestampConverter');
const isBlank = require('../../utils/isBlank');
const isNonBlankString = require('../../utils/isNonBlankString');
const isValidId = require('../../utils/isValidId');
const { validateStringLengths } = require('../../utils/stringLengthValidation');

const VALID_NUMBER_LOCALES = ['en', 'fr'];
const VALID_DATA_QUALITIES = ['raw', 'validated', 'suspect', 'rejected'];
const VALID_TIMESTAMP_TYPES = [
  'datetime',
  'dateOnly',
  'timeOnly',
  ...COMPONENT_TYPES,
];

/**
 * Returns true if the given string is a valid IANA timezone name.
 * Uses Intl.DateTimeFormat which validates against the system's IANA database.
 * Rejects fixed offsets like "+02:00" or "GMT+2".
 */
const isValidTimezone = (tz) => {
  if (typeof tz !== 'string' || tz.length === 0) return false;
  // Reject fixed offsets like '+02:00', '-05:00', 'GMT+2', 'UTC+1'
  if (/^[+-]\d|^(GMT|UTC)[+-]/.test(tz)) return false;
  try {
    // eslint-disable-next-line no-new
    new Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
};

/**
 * Validates profile structure without any DB lookups.
 * Accumulates all errors before returning.
 * @param {Object} profile
 * @returns {string[]} Array of error messages (empty = valid)
 */
const validate = (profile) => {
  const errors = [];

  if (!profile || typeof profile !== 'object') {
    errors.push('Profile must be a non-null object');
    return errors;
  }

  // 1. Required fields
  const requiredFields = [
    'timezone',
    'columnMappings',
    'authorIds',
    'licenseId',
  ];
  requiredFields.forEach((field) => {
    if (isBlank(profile[field])) {
      errors.push(`Missing required field: ${field}`);
    }
  });

  // 1b. columnMappings must be an array (catches truthy non-array values)
  if (
    !isBlank(profile.columnMappings) &&
    !Array.isArray(profile.columnMappings)
  ) {
    errors.push('columnMappings must be an array');
  }

  // 1c. Referenced ID fields must be positive integers when present
  const idFields = ['caveId', 'licenseId'];
  idFields.forEach((field) => {
    const val = profile[field];
    if (val !== undefined && val !== null) {
      if (!isValidId(val)) {
        errors.push(
          `${field} must be a positive integer (got ${JSON.stringify(val)})`
        );
      }
    }
  });

  // 1d. authorIds must be a non-empty array of positive integers.
  // Note: isBlank([]) is false (arrays are not blank), so an empty array passes
  // the required check above but is caught here by the length check.
  if (!isBlank(profile.authorIds)) {
    if (!Array.isArray(profile.authorIds)) {
      errors.push('authorIds must be an array');
    } else if (profile.authorIds.length === 0) {
      errors.push('authorIds must not be empty');
    } else {
      profile.authorIds.forEach((val, idx) => {
        if (!isValidId(val)) {
          errors.push(
            `authorIds[${idx}] must be a positive integer (got ${JSON.stringify(val)})`
          );
        }
      });
    }
  }

  // 2. IANA timezone validation
  if (!isBlank(profile.timezone)) {
    if (!isValidTimezone(profile.timezone)) {
      errors.push(
        `Invalid IANA timezone: '${profile.timezone}'. Fixed offsets like "+02:00" are not accepted.`
      );
    }
  }

  // 3. columnMappings validation (roles and structure)
  if (Array.isArray(profile.columnMappings)) {
    const hasTimestamp = profile.columnMappings.some(
      (col) => col.role === 'timestamp'
    );
    const hasMeasurement = profile.columnMappings.some(
      (col) => col.role === 'measurement'
    );

    if (!hasTimestamp) {
      errors.push(
        'columnMappings must contain at least one column with role "timestamp"'
      );
    }
    if (!hasMeasurement) {
      errors.push(
        'columnMappings must contain at least one column with role "measurement"'
      );
    }

    // 4. Each measurement column must have a valid sensorConfigurationId and optional mediumId
    profile.columnMappings.forEach((col, index) => {
      if (col.role === 'measurement') {
        if (!col.sensorConfigurationId) {
          errors.push(
            `columnMappings[${index}]: sensorConfigurationId is required for measurement columns`
          );
        } else if (!isValidId(col.sensorConfigurationId)) {
          errors.push(
            `columnMappings[${index}]: sensorConfigurationId must be a positive integer (got ${JSON.stringify(col.sensorConfigurationId)})`
          );
        }

        // Validate mediumId on measurement columns where it is present
        if (!isBlank(col.mediumId) && !isValidId(col.mediumId)) {
          errors.push(
            `columnMappings[${index}]: mediumId must be a positive integer (got ${JSON.stringify(col.mediumId)})`
          );
        }
      }

      if (col.role === 'timestamp' && col.timestampType) {
        if (!VALID_TIMESTAMP_TYPES.includes(col.timestampType)) {
          errors.push(
            `columnMappings[${index}]: invalid timestampType '${col.timestampType}'. Must be one of: ${VALID_TIMESTAMP_TYPES.join(', ')}`
          );
        }
      }
    });

    // 5. Timestamp column pairing: dateOnly requires timeOnly and vice versa
    const hasDateOnly = profile.columnMappings.some(
      (col) => col.role === 'timestamp' && col.timestampType === 'dateOnly'
    );
    const hasTimeOnly = profile.columnMappings.some(
      (col) => col.role === 'timestamp' && col.timestampType === 'timeOnly'
    );

    if (hasDateOnly && !hasTimeOnly) {
      errors.push(
        'A column with timestampType "dateOnly" requires a matching column with timestampType "timeOnly"'
      );
    }
    if (hasTimeOnly && !hasDateOnly) {
      errors.push(
        'A column with timestampType "timeOnly" requires a matching column with timestampType "dateOnly"'
      );
    }

    // 5a. dateFormat is required when timestampType is "datetime"
    const hasDatetime = profile.columnMappings.some(
      (col) => col.role === 'timestamp' && col.timestampType === 'datetime'
    );
    if (hasDatetime && !profile.dateFormat) {
      errors.push(
        'dateFormat is required when a column has timestampType "datetime" (e.g. "YYYY-MM-DD HH:mm:ss")'
      );
    }

    // 5b. dateOnlyFormat and timeOnlyFormat are required for split mode
    if (hasDateOnly && hasTimeOnly) {
      if (!profile.dateOnlyFormat) {
        errors.push(
          'dateOnlyFormat is required when using dateOnly/timeOnly timestamp columns (e.g. "YYYY-MM-DD")'
        );
      }
      if (!profile.timeOnlyFormat) {
        errors.push(
          'timeOnlyFormat is required when using dateOnly/timeOnly timestamp columns (e.g. "HH:mm:ss")'
        );
      }
    }

    // 5b. Component-based timestamps: year, month, day are required together
    // elapsed_seconds is in COMPONENT_TYPES but is not a date component — it
    // represents either a Unix epoch or an offset. Exclude it so that a
    // standalone elapsed_seconds profile doesn't trigger the year/month/day check.
    const componentColumns = profile.columnMappings.filter(
      (col) =>
        col.role === 'timestamp' &&
        COMPONENT_TYPES.includes(col.timestampType) &&
        col.timestampType !== 'elapsed_seconds'
    );
    if (componentColumns.length > 0) {
      const componentTypes = new Set(
        componentColumns.map((col) => col.timestampType)
      );
      const requiredComponents = ['year', 'month', 'day'];
      const missingComponents = requiredComponents.filter(
        (c) => !componentTypes.has(c)
      );
      if (missingComponents.length > 0) {
        errors.push(
          `Component-based timestamps require at least year, month, and day columns. Missing: ${missingComponents.join(', ')}`
        );
      }
    }
  }

  // 6. caveId or pointLabel presence
  const hasCaveId = !isBlank(profile.caveId);
  const hasPointLabel = isNonBlankString(profile.pointLabel);
  if (!isBlank(profile.pointLabel) && typeof profile.pointLabel !== 'string') {
    errors.push('pointLabel must be a string when provided');
  }
  if (!hasCaveId && !hasPointLabel) {
    errors.push('Either caveId or pointLabel must be provided');
  }

  // 7. numberLocale validation (if provided)
  if (!isBlank(profile.numberLocale)) {
    if (!VALID_NUMBER_LOCALES.includes(profile.numberLocale)) {
      errors.push(
        `Invalid numberLocale: '${profile.numberLocale}'. Must be one of: ${VALID_NUMBER_LOCALES.join(', ')}`
      );
    }
  }

  // 8. dataQuality validation (if provided)
  if (!isBlank(profile.dataQuality)) {
    if (!VALID_DATA_QUALITIES.includes(profile.dataQuality)) {
      errors.push(
        `Invalid dataQuality: '${profile.dataQuality}'. Must be one of: ${VALID_DATA_QUALITIES.join(', ')}`
      );
    }
  }

  // 9. documentLanguage is required when documentTitle is provided
  const hasDocumentTitle = isNonBlankString(profile.documentTitle);
  if (
    !isBlank(profile.documentTitle) &&
    typeof profile.documentTitle !== 'string'
  ) {
    errors.push('documentTitle must be a string when provided');
  }
  if (hasDocumentTitle && !profile.documentLanguage) {
    errors.push(
      'documentLanguage is required when documentTitle is provided (ISO 639-2 code, e.g. "eng", "fra")'
    );
  }

  // 10. headerRow must be a positive integer when provided
  if (profile.headerRow !== undefined && profile.headerRow !== null) {
    if (
      typeof profile.headerRow !== 'number' ||
      !Number.isInteger(profile.headerRow) ||
      profile.headerRow < 1
    ) {
      errors.push(
        `headerRow must be an integer >= 1 (got ${JSON.stringify(profile.headerRow)})`
      );
    }
  }

  // 11. String field length validation against model maxLength constraints.
  //     Catches length violations early (before the DB transaction) so users
  //     get a 400 instead of a 500.
  const lengthErrors = validateStringLengths({
    observationName: { value: profile.observationName, maxLength: 200 },
    pointLabel: { value: profile.pointLabel, maxLength: 200 },
    documentTitle: { value: profile.documentTitle, maxLength: 300 },
  });
  lengthErrors.forEach((err) => errors.push(err.message));

  return errors;
};

module.exports = {
  validate,
};
