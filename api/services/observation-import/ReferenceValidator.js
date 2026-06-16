/**
 * ReferenceValidator.js
 *
 * Validates that all entity IDs referenced in the import profile actually exist
 * in the database. Returns resolved entity objects alongside any errors so
 * downstream services can avoid redundant lookups.
 *
 * All checks run in parallel (Promise.all). All errors are accumulated — no
 * fail-fast behaviour.
 */

const isBlank = require('../../utils/isBlank');

/**
 * @typedef {Object} ResolvedEntities
 * @property {Object|null}      cave          - Resolved TCave record (or null)
 * @property {Object}           license       - Resolved TLicense record
 * @property {Map<number,Object>} media       - Map of mediumId → TMedium record
 * @property {Map<number,Object>} sensorConfigs - Map of sensorConfigurationId → TSensorConfiguration (with quantityKind populated)
 */

/**
 * Validates that all referenced entity IDs exist in the database.
 * @param {Object} profile - The import profile JSON
 * @returns {Promise<{ errors: string[], resolved: ResolvedEntities }>}
 */
const validate = async (profile) => {
  const errors = [];

  /** @type {ResolvedEntities} */
  const resolved = {
    cave: null,
    license: null,
    media: new Map(),
    sensorConfigs: new Map(),
  };

  const columnMappings = Array.isArray(profile.columnMappings)
    ? profile.columnMappings
    : [];

  // Collect unique mediumIds and sensorConfigurationIds from measurement columns
  const measurementColumns = columnMappings.filter(
    (col) => col.role === 'measurement'
  );

  const uniqueMediumIds = [
    ...new Set(
      measurementColumns
        .map((col, idx) => ({ id: col.mediumId, idx }))
        .filter(({ id }) => !isBlank(id))
        .map(({ id }) => id)
    ),
  ];

  const uniqueSensorConfigEntries = measurementColumns
    .map((col, idx) => ({ id: col.sensorConfigurationId, idx }))
    .filter(({ id }) => !isBlank(id));

  // Build a map from sensorConfigurationId → column indices (for error messages)
  const sensorConfigIndexMap = new Map();
  uniqueSensorConfigEntries.forEach(({ id, idx }) => {
    if (!sensorConfigIndexMap.has(id)) {
      sensorConfigIndexMap.set(id, []);
    }
    sensorConfigIndexMap.get(id).push(idx);
  });

  // Build a map from mediumId → column indices (for error messages)
  const mediumIndexMap = new Map();
  measurementColumns.forEach((col, idx) => {
    const { mediumId } = col;
    if (!isBlank(mediumId)) {
      if (!mediumIndexMap.has(mediumId)) {
        mediumIndexMap.set(mediumId, []);
      }
      mediumIndexMap.get(mediumId).push(idx);
    }
  });

  // --- Build all check promises ---

  const checks = [];

  // Cave check (optional)
  if (!isBlank(profile.caveId)) {
    checks.push(
      TCave.findOne({ id: profile.caveId }).then((cave) => {
        if (!cave) {
          errors.push(`caveId: Cave with ID ${profile.caveId} not found`);
        } else {
          resolved.cave = cave;
        }
      })
    );
  }

  // License check (required)
  if (!isBlank(profile.licenseId)) {
    checks.push(
      TLicense.findOne({ id: profile.licenseId }).then((license) => {
        if (!license) {
          errors.push(
            `licenseId: License with ID ${profile.licenseId} not found`
          );
        } else {
          resolved.license = license;
        }
      })
    );
  }

  // Author checks: verify all unique author IDs from authorIds exist
  const uniqueAuthorIds = [...new Set(profile.authorIds || [])];
  uniqueAuthorIds.forEach((authorId) => {
    checks.push(
      TCaver.findOne({ id: authorId }).then((author) => {
        if (!author) {
          errors.push(`authorIds: Caver with ID ${authorId} not found`);
        }
      })
    );
  });

  // Medium checks (per column mapping, unique IDs)
  uniqueMediumIds.forEach((mediumId) => {
    const indices = mediumIndexMap.get(mediumId) || [];
    const fieldName =
      indices.length === 1
        ? `columnMappings[${indices[0]}].mediumId`
        : `columnMappings[${indices.join(', ')}].mediumId`;

    checks.push(
      TMedium.findOne({ id: mediumId }).then((medium) => {
        if (!medium) {
          errors.push(`${fieldName}: Medium with ID ${mediumId} not found`);
        } else {
          resolved.media.set(mediumId, medium);
        }
      })
    );
  });

  // SensorConfiguration checks (per column mapping, unique IDs, with quantityKind populated)
  const uniqueSensorConfigIds = [...sensorConfigIndexMap.keys()];
  uniqueSensorConfigIds.forEach((sensorConfigId) => {
    const indices = sensorConfigIndexMap.get(sensorConfigId) || [];
    const fieldName =
      indices.length === 1
        ? `columnMappings[${indices[0]}].sensorConfigurationId`
        : `columnMappings[${indices.join(', ')}].sensorConfigurationId`;

    checks.push(
      TSensorConfiguration.findOne({ id: sensorConfigId })
        .populate('quantityKind')
        .populate('unit')
        .then((sensorConfig) => {
          if (!sensorConfig) {
            errors.push(
              `${fieldName}: SensorConfiguration with ID ${sensorConfigId} not found`
            );
          } else {
            resolved.sensorConfigs.set(sensorConfigId, sensorConfig);
          }
        })
    );
  });

  // Run all checks in parallel
  await Promise.all(checks);

  return { errors, resolved };
};

module.exports = {
  validate,
};
