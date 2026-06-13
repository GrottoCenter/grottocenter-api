/**
 * ObservationImportService.js
 *
 * Orchestrator for the scientific data import pipeline.
 * Coordinates all sub-services in order:
 *
 *   1. ProfileValidator  — structural validation (no DB)
 *   2. ReferenceValidator — FK existence checks (DB lookups)
 *   3. Parser             — decode + split file buffer into row arrays
 *   4. TimestampConverter — parse timestamps → UTC Date objects
 *   5. SIConverter        — convert display-unit values → SI units
 *   6. EntityBuilder      — create all DB entities in one transaction
 *
 * Each stage wraps its errors in a typed ImportError so the controller
 * can map them to the correct HTTP status and structured response body.
 */

const ProfileValidator = require('./observation-import/ProfileValidator');
const ReferenceValidator = require('./observation-import/ReferenceValidator');
const Parser = require('./observation-import/Parser');
const TimestampConverter = require('./observation-import/TimestampConverter');
const SIConverter = require('./observation-import/SIConverter');
const EntityBuilder = require('./observation-import/EntityBuilder');

// ---------------------------------------------------------------------------
// Typed error class
// ---------------------------------------------------------------------------

/**
 * Error thrown by the import pipeline when a stage fails.
 * The controller maps error.code → HTTP status and formats the response.
 */
class ImportError extends Error {
  /**
   * @param {string} code   - One of the IMPORT_* codes (e.g. IMPORT_VALIDATION_ERROR)
   * @param {string} message - Human-readable description
   * @param {Array<{field: string, message: string}>} [details] - Per-field errors
   */
  constructor(code, message, details = []) {
    super(message);
    this.name = 'ImportError';
    this.code = code;
    this.details = details;
  }
}

// ---------------------------------------------------------------------------
// Pipeline orchestrator
// ---------------------------------------------------------------------------

/**
 * Executes the full import pipeline.
 *
 * @param {Object} file             - Multer file object { buffer, originalname, size, mimetype }
 * @param {Object} profile          - Parsed profile JSON
 * @param {number} requestAuthorId  - Authenticated user ID (from req.token.id)
 * @returns {Promise<{
 *   observationId: number,
 *   pointId: number|null,
 *   documentId: number,
 *   timeSeriesMap: Object<string, number>,
 *   measurementCount: number,
 *   observationDate: Date,
 *   importedAt: Date,
 *   importedBy: number,
 * }>}
 * @throws {ImportError}
 */
const execute = async (file, profile, requestAuthorId) => {
  // -------------------------------------------------------------------------
  // Stage 1: ProfileValidator — structural validation (no DB)
  // -------------------------------------------------------------------------
  const profileErrors = ProfileValidator.validate(profile);
  if (profileErrors.length > 0) {
    throw new ImportError(
      'IMPORT_VALIDATION_ERROR',
      'Profile validation failed',
      profileErrors.map((msg) => ({ field: 'profile', message: msg }))
    );
  }

  // -------------------------------------------------------------------------
  // Stage 2: ReferenceValidator — FK existence checks
  // -------------------------------------------------------------------------
  const { errors: refErrors, resolved: resolvedEntities } =
    await ReferenceValidator.validate(profile);
  if (refErrors.length > 0) {
    throw new ImportError(
      'IMPORT_REFERENCE_ERROR',
      'Referenced entity validation failed',
      refErrors.map((msg) => ({ field: '', message: msg }))
    );
  }

  // -------------------------------------------------------------------------
  // Stage 3: Parser — decode and split the file buffer into rows
  // -------------------------------------------------------------------------
  let parsedResult;
  try {
    parsedResult = Parser.parse(file.buffer, profile);
  } catch (err) {
    throw new ImportError('IMPORT_PARSE_ERROR', err.message, []);
  }

  const { rows, columnIndices } = parsedResult;

  // -------------------------------------------------------------------------
  // Compute the file-line offset so that row numbers in error messages
  // reference the original file line rather than the parsed-data index.
  // Offset = (headerRow lines consumed) + (skipFirstRows lines consumed).
  // The Parser already removed these lines from the data, so any 1-based
  // row number from downstream stages must be shifted by this amount.
  // -------------------------------------------------------------------------
  const fileRowOffset =
    (profile.headerRow != null ? profile.headerRow : 0) +
    (profile.skipFirstRows || 0);

  // -------------------------------------------------------------------------
  // Stage 4: TimestampConverter — parse timestamps → UTC Date objects
  // -------------------------------------------------------------------------
  let convertedTimestamps;
  try {
    convertedTimestamps = TimestampConverter.convert(
      rows,
      profile,
      columnIndices,
      fileRowOffset
    );
  } catch (err) {
    throw new ImportError('IMPORT_TIMESTAMP_ERROR', err.message, []);
  }

  // -------------------------------------------------------------------------
  // Stage 5: SIConverter — convert display-unit measurement values to SI units
  //
  // Build sensorConfigMap: Map<columnIndex → sensorConfig> from the resolved
  // entities and the profile's measurement column mappings.
  // -------------------------------------------------------------------------
  const sensorConfigMap = new Map();
  const measurementMappings = (profile.columnMappings || []).filter(
    (col) => col.role === 'measurement'
  );
  measurementMappings.forEach((col) => {
    const sensorConfig = resolvedEntities.sensorConfigs.get(
      col.sensorConfigurationId
    );
    if (sensorConfig) {
      sensorConfigMap.set(col.columnIndex, sensorConfig);
    }
  });

  let convertedMeasurements;
  try {
    convertedMeasurements = SIConverter.convertAll(
      rows,
      sensorConfigMap,
      columnIndices,
      profile,
      fileRowOffset
    );
  } catch (err) {
    throw new ImportError('IMPORT_CONVERSION_ERROR', err.message, []);
  }

  // -------------------------------------------------------------------------
  // Stage 6: EntityBuilder — create all DB entities in a single transaction
  // -------------------------------------------------------------------------
  const parsedData = {
    rows,
    timestamps: convertedTimestamps,
    measurements: convertedMeasurements,
  };

  let importResult;
  try {
    importResult = await EntityBuilder.build({
      parsedData,
      profile,
      resolvedEntities,
      file,
      requestAuthorId,
    });
  } catch (err) {
    // If it's already an ImportError, re-throw; otherwise wrap it
    if (err instanceof ImportError) {
      throw err;
    }
    // Classify constraint violations as client errors (not 500)
    if (err.code === 'E_UNIQUE') {
      throw new ImportError(
        'IMPORT_CONFLICT_ERROR',
        `A record with conflicting values already exists: ${err.message}`,
        []
      );
    }
    throw new ImportError('IMPORT_TRANSACTION_ERROR', err.message, []);
  }

  return importResult;
};

module.exports = {
  execute,
  ImportError,
};
