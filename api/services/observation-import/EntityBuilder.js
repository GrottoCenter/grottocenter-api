/**
 * EntityBuilder.js
 *
 * Creates all database entities for an observation import within a single
 * PostgreSQL transaction. The sequence is:
 *
 *   1. Resolve or create TPoint (label + cave, case-sensitive)
 *   2. Create TObservation with denormalized fields
 *   3. Create TDocument (type=Dataset, license, author, title derived from profile/filename)
 *   4. Upload raw data file to Azure via FileService.document.create()
 *   5. For each measurement column:
 *      a. Create TTimeSeries with computed metadata
 *      b. Bulk INSERT TMeasurement in batches of 1000
 *      c. Create TTimeSeriesQualityLog
 *   6. Optionally create TName linked to the observation
 *   7. Build import result and upload profile JSON (with embedded metadata) to Azure
 *
 * All Waterline calls use .usingConnection(db) so they participate in the
 * same transaction. FileService is called inside the transaction callback so
 * a file-upload failure still rolls back the DB record created in step 3.
 */

const FileService = require('../FileService');
const PartitionManager = require('./PartitionManager');

const BATCH_SIZE = 1000;

/**
 * Derives the document title from the profile or falls back to the filename
 * without its extension.
 *
 * @param {string|undefined} documentTitle - profile.documentTitle
 * @param {string} originalname - multer file.originalname
 * @returns {string}
 */
const deriveDocumentTitle = (documentTitle, originalname) => {
  if (documentTitle && documentTitle.trim().length > 0) {
    return documentTitle.trim();
  }
  // Strip everything after the last dot (extension)
  const lastDot = originalname.lastIndexOf('.');
  return lastDot > 0 ? originalname.slice(0, lastDot) : originalname;
};

/**
 * Builds the enriched profile JSON with embedded metadata for Azure upload.
 * Pure function — receives all dependencies explicitly.
 *
 * @param {Object} profile - Original import profile
 * @param {Object} importResult - Result metadata from entity creation
 * @param {Object} resolvedEntities - Resolved DB entities (sensorConfigs, media)
 * @param {Map<number, Object>} unitMap - Map of unit ID → TUnit record
 * @returns {Object} Profile object with embedded metadata
 */
const buildProfileWithMetadata = (
  profile,
  importResult,
  resolvedEntities,
  unitMap
) => ({
  ...profile,
  columnMappings: profile.columnMappings.map((col) => {
    if (col.role !== 'measurement') return col;
    const sc = resolvedEntities.sensorConfigs.get(col.sensorConfigurationId);
    if (!sc) return col;
    const { unit: scUnit } = sc;
    let unit = null;
    if (scUnit && typeof scUnit === 'object') {
      unit = scUnit;
    } else if (scUnit) {
      unit = unitMap.get(scUnit);
    }
    const medium = col.mediumId
      ? resolvedEntities.media.get(Number(col.mediumId))
      : null;
    return {
      ...col,
      metadata: {
        quantityKind: sc.quantityKind
          ? { id: sc.quantityKind.id, code: sc.quantityKind.code }
          : null,
        unit: unit ? { id: unit.id, symbol: unit.symbol } : null,
        medium: medium ? { id: medium.id, code: medium.code } : null,
      },
    };
  }),
  metadata: importResult,
});

const resolveQuantityKindCode = (sensorConfig) => {
  if (sensorConfig && sensorConfig.quantityKind) {
    return sensorConfig.quantityKind.code || '';
  }
  return '';
};

/**
 * Inserts measurements for one time series in batches.
 * Sequential execution is required to stay within the transaction.
 *
 * @param {Array<{value,valueSi,timestamp}>} colMeasurements
 * @param {number} timeSeriesId
 * @param {*} db - Waterline connection
 */
const insertMeasurementBatches = async (colMeasurements, timeSeriesId, db) => {
  for (let i = 0; i < colMeasurements.length; i += BATCH_SIZE) {
    const batch = colMeasurements.slice(i, i + BATCH_SIZE);
    const valuePlaceholders = batch
      .map((_entry, idx) => {
        const offset = idx * 4;
        return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4})`;
      })
      .join(', ');
    const queryParams = batch.flatMap((entry) => [
      timeSeriesId,
      entry.value,
      entry.valueSi,
      entry.timestamp,
    ]);
    // Sequential awaits are intentional — each batch must complete before the next
    // within a DB transaction.
    // eslint-disable-next-line no-await-in-loop
    await CommonService.query(
      `INSERT INTO t_measurement (id_time_series, value, value_si, timestamp) VALUES ${valuePlaceholders}`,
      queryParams,
      db
    );
  }
};

/**
 * Processes one measurement column: creates TTimeSeries, inserts TMeasurement
 * rows in batches, and creates TTimeSeriesQualityLog.
 *
 * @returns {Promise<number>} The created time series ID
 */
const processColumn = async ({
  colMapping,
  measurements,
  timestamps,
  observation,
  profile,
  resolvedEntities,
  requestAuthorId,
  unitMap,
  now,
  db,
}) => {
  const { columnIndex, sensorConfigurationId, mediumId } = colMapping;
  const { media, sensorConfigs } = resolvedEntities;

  const sensorConfig = sensorConfigs.get(sensorConfigurationId);
  const medium = mediumId ? media.get(Number(mediumId)) : null;

  // Collect measurements for this column across all rows
  const colMeasurements = measurements
    .map((rowMeasurements, rowIdx) => {
      const entry = rowMeasurements.find(
        (rowEntry) => rowEntry.columnIndex === columnIndex
      );
      if (!entry) return null;
      return {
        value: entry.value,
        valueSi: entry.valueSi,
        timestamp: timestamps[rowIdx],
      };
    })
    .filter(Boolean);

  if (colMeasurements.length === 0) {
    return null;
  }

  // Compute metadata
  const values = colMeasurements.map((entry) => entry.value);
  const startDate = new Date(
    colMeasurements.reduce(
      (min, entry) => Math.min(min, entry.timestamp.getTime()),
      Infinity
    )
  );
  const endDate = new Date(
    colMeasurements.reduce(
      (max, entry) => Math.max(max, entry.timestamp.getTime()),
      -Infinity
    )
  );
  const minValue = values.reduce((a, b) => Math.min(a, b), Infinity);
  const maxValue = values.reduce((a, b) => Math.max(a, b), -Infinity);

  // Resolve denormalized fields
  const quantityKindCode = resolveQuantityKindCode(sensorConfig);

  let unitSymbol = '';
  if (sensorConfig && sensorConfig.unit) {
    // sensorConfig.unit is populated (full object) from ReferenceValidator
    const unit =
      typeof sensorConfig.unit === 'object'
        ? sensorConfig.unit
        : unitMap.get(sensorConfig.unit);
    if (unit) unitSymbol = unit.symbol;
  }

  const mediumCode = medium ? medium.code : null;

  const timeSeriesData = {
    observation: observation.id,
    sensorConfiguration: sensorConfigurationId,
    author: requestAuthorId,
    dateInscription: now,
    startDate,
    endDate,
    measurementCount: colMeasurements.length,
    minValue,
    maxValue,
    dataQuality: profile.dataQuality || 'raw',
    quantityKindCode,
    unitSymbol,
    timezoneOffset: profile.timezone || null,
  };

  if (medium) {
    timeSeriesData.medium = medium.id;
    timeSeriesData.mediumCode = mediumCode;
  }

  if (
    profile.samplingIntervalSeconds !== undefined &&
    profile.samplingIntervalSeconds !== null
  ) {
    timeSeriesData.samplingIntervalSeconds = profile.samplingIntervalSeconds;
  }

  // eslint-disable-next-line no-await-in-loop
  const timeSeries = await TTimeSeries.create(timeSeriesData)
    .usingConnection(db)
    .fetch();

  // Bulk INSERT TMeasurement in batches of 1000
  // eslint-disable-next-line no-await-in-loop
  await insertMeasurementBatches(colMeasurements, timeSeries.id, db);

  // Create TTimeSeriesQualityLog
  // eslint-disable-next-line no-await-in-loop
  await TTimeSeriesQualityLog.create({
    timeSeries: timeSeries.id,
    oldQuality: null,
    newQuality: profile.dataQuality || 'raw',
    changedBy: requestAuthorId,
    changedAt: now,
  }).usingConnection(db);

  return { id: timeSeries.id, measurementCount: colMeasurements.length };
};

/**
 * Creates all database entities within a transaction.
 *
 * @param {Object} params
 * @param {Object} params.parsedData
 *   { rows: string[][], timestamps: Date[], measurements: Array<{columnIndex, value, valueSi}[]> }
 * @param {Object} params.profile - Full profile JSON
 * @param {Object} params.resolvedEntities
 *   { cave, license, author, media: Map<id,TMedium>, sensorConfigs: Map<id,TSensorConfiguration> }
 * @param {Object} params.file - Multer file object { buffer, originalname, size, mimetype }
 * @param {number} params.requestAuthorId - Authenticated user ID
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
 */
const build = async ({
  parsedData,
  profile,
  resolvedEntities,
  file,
  requestAuthorId,
}) => {
  const { timestamps, measurements } = parsedData;
  const { cave, license, author } = resolvedEntities;

  // Defensive check: timestamps and measurements must be aligned (same row count)
  if (timestamps.length !== measurements.length) {
    throw new Error(
      `Pipeline integrity error: timestamps (${timestamps.length}) and measurements (${measurements.length}) arrays must have the same length.`
    );
  }

  // Identify measurement columns from profile
  const measurementColumns = profile.columnMappings.filter(
    (col) => col.role === 'measurement'
  );

  // Compute the earliest timestamp → observationDate
  const observationDate = new Date(
    timestamps.reduce((min, t) => Math.min(min, t.getTime()), Infinity)
  );

  let importResult;

  await sails.getDatastore().transaction(async (db) => {
    // Capture a single timestamp for all dateInscription/audit fields within
    // this transaction, ensuring exact consistency across entities.
    const now = new Date();

    // -------------------------------------------------------------------------
    // 1. Resolve or create TPoint
    // -------------------------------------------------------------------------
    let point = null;
    if (profile.pointLabel) {
      point = await TPoint.findOne({
        label: profile.pointLabel,
        cave: profile.caveId || null,
      }).usingConnection(db);

      if (!point) {
        const pointData = {
          label: profile.pointLabel,
          author: requestAuthorId,
          dateInscription: now,
        };
        if (profile.caveId) {
          pointData.cave = profile.caveId;
        }
        if (profile.latitude !== undefined && profile.latitude !== null) {
          pointData.latitude = profile.latitude;
        }
        if (profile.longitude !== undefined && profile.longitude !== null) {
          pointData.longitude = profile.longitude;
        }
        point = await TPoint.create(pointData).usingConnection(db).fetch();
      }
    }

    // -------------------------------------------------------------------------
    // 2. Create TObservation
    // -------------------------------------------------------------------------

    // Resolve cave name from the cave's TName records if caveId is provided
    let caveName = null;
    if (cave) {
      const caveMainName = await TName.findOne({
        cave: cave.id,
        isMain: true,
      }).usingConnection(db);
      if (caveMainName) {
        caveName = caveMainName.name;
      }
    }

    // Find the observation type record by code
    const observationType = await TObservationType.findOne({
      code: 'physical_measurements',
    }).usingConnection(db);

    if (!observationType) {
      throw new Error(
        "Missing required seed data: TObservationType with code 'physical_measurements' not found. " +
          'Ensure the database has been seeded correctly.'
      );
    }

    const observationData = {
      observationType: observationType.id,
      observationTypeCode: 'physical_measurements',
      observationDate,
      author: requestAuthorId,
      dateInscription: now,
    };

    if (point) {
      observationData.point = point.id;
      observationData.pointLabel = point.label;
      if (point.latitude !== undefined && point.latitude !== null) {
        observationData.latitude = point.latitude;
      }
      if (point.longitude !== undefined && point.longitude !== null) {
        observationData.longitude = point.longitude;
      }
    }

    if (profile.caveId) {
      observationData.cave = profile.caveId;
    }

    if (caveName) {
      observationData.caveName = caveName;
    }

    const observation = await TObservation.create(observationData)
      .usingConnection(db)
      .fetch();

    // -------------------------------------------------------------------------
    // 3. Create TDocument
    // -------------------------------------------------------------------------
    const documentTitle = deriveDocumentTitle(
      profile.documentTitle,
      file.originalname
    );

    const documentData = {
      type: 2, // Dataset
      license: license ? license.id : profile.licenseId,
      author: author ? author.id : profile.authorId,
      isValidated: false,
      dateInscription: now,
    };

    if (profile.caveId) {
      documentData.cave = profile.caveId;
    }

    const document = await TDocument.create(documentData)
      .usingConnection(db)
      .fetch();

    // Create document description with the title
    // Use the language from the profile when a custom title is provided;
    // fall back to 'eng' when the title is derived from the filename.
    const descriptionLanguage =
      profile.documentTitle && profile.documentTitle.trim().length > 0
        ? profile.documentLanguage
        : 'eng';

    await TDescription.create({
      title: documentTitle,
      author: requestAuthorId,
      document: document.id,
      language: descriptionLanguage,
      dateInscription: now,
    }).usingConnection(db);

    // Link the author in the junction table
    await JDocumentCaverAuthor.create({
      document: document.id,
      caver: author ? author.id : profile.authorId,
    }).usingConnection(db);

    // -------------------------------------------------------------------------
    // 4. Upload raw data file to Azure
    //    (inside transaction so failure rolls back doc)
    // -------------------------------------------------------------------------
    await FileService.document.create(file, document.id, false, true, db);

    // -------------------------------------------------------------------------
    // 5a. Ensure quarterly partitions exist for all timestamps in this import.
    //     Must run before any TMeasurement INSERT to prevent missing-partition errors.
    // -------------------------------------------------------------------------
    await PartitionManager.ensurePartitions(timestamps, db);

    // -------------------------------------------------------------------------
    // 5b. For each measurement column: create TTimeSeries, bulk INSERT TMeasurement,
    //     and create TTimeSeriesQualityLog
    // -------------------------------------------------------------------------
    const timeSeriesMap = {};
    let totalMeasurements = 0;

    // Build unitMap from pre-populated sensor configurations (resolved in
    // ReferenceValidator via .populate('unit')). No additional DB query needed.
    // unitMap is also used in step 7 (profile enrichment) — keep it accessible
    // to the entire transaction scope.
    const unitMap = new Map();
    for (const sc of resolvedEntities.sensorConfigs.values()) {
      if (sc.unit && typeof sc.unit === 'object') {
        unitMap.set(sc.unit.id, sc.unit);
      }
    }

    // Sequential processing is required for the transaction connection to be
    // shared correctly across all DB calls.
    for (const colMapping of measurementColumns) {
      // eslint-disable-next-line no-await-in-loop
      const colResult = await processColumn({
        colMapping,
        measurements,
        timestamps,
        observation,
        profile,
        resolvedEntities,
        requestAuthorId,
        unitMap,
        now,
        db,
      });

      if (colResult) {
        timeSeriesMap[colMapping.sensorConfigurationId] = colResult.id;
        totalMeasurements += colResult.measurementCount;
      }
    }

    // -------------------------------------------------------------------------
    // 6. Optionally create TName for the observation
    // -------------------------------------------------------------------------
    if (profile.observationName && profile.observationName.trim().length > 0) {
      await TName.create({
        name: profile.observationName.trim(),
        isMain: true,
        observation: observation.id,
        author: requestAuthorId,
        language: profile.documentLanguage || 'eng',
        dateInscription: now,
      }).usingConnection(db);
    }

    // -------------------------------------------------------------------------
    // 7. Upload profile JSON to Azure (with embedded metadata)
    // -------------------------------------------------------------------------
    const lastDot = file.originalname.lastIndexOf('.');
    const csvBasename =
      lastDot > 0 ? file.originalname.slice(0, lastDot) : file.originalname;

    importResult = {
      observationId: observation.id,
      pointId: point ? point.id : null,
      documentId: document.id,
      timeSeriesMap,
      measurementCount: totalMeasurements,
      observationDate: observation.observationDate,
      importedAt: now,
      importedBy: requestAuthorId,
    };

    const profileWithMetadata = buildProfileWithMetadata(
      profile,
      importResult,
      resolvedEntities,
      unitMap
    );

    const profileBuffer = Buffer.from(
      JSON.stringify(profileWithMetadata, null, 2),
      'utf8'
    );
    const profileFile = {
      originalname: `${csvBasename}-profile.json`,
      buffer: profileBuffer,
      size: profileBuffer.length,
      mimetype: 'application/json',
    };
    await FileService.document.create(
      profileFile,
      document.id,
      false,
      true,
      db
    );
  });

  return importResult;
};

module.exports = {
  build,
  deriveDocumentTitle,
};
