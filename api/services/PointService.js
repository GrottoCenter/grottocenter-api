const CaveLifecycleService = require('./CaveLifecycleService');
const isValidId = require('../utils/isValidId');

// Document types a point can be positioned on (sql/2_2021_09_26_1_doc_types.sql):
// Topographic Drawing, Topographic Data and Map — plans and sections.
const POSITION_DOCUMENT_TYPE_IDS = [13, 14, 19];

const LABEL_MAX_LENGTH = 200;

// Positions included in a point's details; the complete collection is served
// by GET /api/v1/points/:id/positions.
const POSITIONS_SUMMARY_SIZE = 20;

const UPDATABLE_FIELDS = [
  'label',
  'caveId',
  'underground',
  'latitude',
  'longitude',
];

// The single-position fields of the first version of the contract. Rejected
// rather than ignored, so that a client still sending them finds out.
const LEGACY_POSITION_FIELDS = ['referenceDocumentId', 'x', 'y'];

const isFiniteNumber = (value) =>
  typeof value === 'number' && Number.isFinite(value);

const toNullableNumber = (value) =>
  value === null || value === undefined ? null : Number(value);

/**
 * Validate the label of a point.
 * @returns {string|null} an error message, or null when valid
 */
const validateLabel = (label) => {
  if (typeof label !== 'string' || !label.trim()) {
    return 'You must provide a non-blank label for the point.';
  }
  if (label.trim().length > LABEL_MAX_LENGTH) {
    return `The point label must not exceed ${LABEL_MAX_LENGTH} characters.`;
  }
  return null;
};

/**
 * Validate the cave of a point: null, or the id of an existing cave.
 * @param {*} caveId
 * @param {Object} [db] - the transaction connection to read the cave on
 * @returns {Promise<string|null>} an error message, or null when valid
 */
const validateCave = async (caveId, db = null) => {
  if (caveId === null) return null;
  if (!isValidId(caveId)) {
    return 'caveId must be a positive integer or null.';
  }
  // On a transaction, the cave is locked until the point is written: a cave
  // emptied, merged or deleted meanwhile cannot be left with a new point
  // after its points were transferred or detached (#1982).
  const exists = db
    ? await CaveLifecycleService.lockCaveForScientificWrite(caveId, db)
    : !!(await TCave.findOne({ id: caveId, isDeleted: false }));
  if (!exists) return `Cave of id ${caveId} not found.`;
  return null;
};

/**
 * Validate one geographic coordinate as sent by the client: null, or a finite
 * JSON number within [-bound, bound]. 0 is a valid coordinate.
 * @returns {string|null} an error message, or null when valid
 */
const validateCoordinate = (name, value, bound) => {
  if (value === null) return null;
  if (!isFiniteNumber(value)) {
    return `${name} must be a finite number or null.`;
  }
  if (value < -bound || value > bound) {
    return `${name} must be between -${bound} and ${bound}.`;
  }
  return null;
};

/**
 * Validate the location of a point as it will be stored, after the omitted
 * fields of a partial update have been taken from the current point.
 * @returns {string|null} an error message, or null when valid
 */
const validateResultingLocation = ({ underground, latitude, longitude }) => {
  if ((latitude === null) !== (longitude === null)) {
    return 'latitude and longitude must be both set or both null.';
  }
  if (underground === false && latitude === null) {
    return 'A surface point (underground: false) must have a latitude and a longitude.';
  }
  return null;
};

module.exports = {
  POSITION_DOCUMENT_TYPE_IDS,
  LABEL_MAX_LENGTH,
  POSITIONS_SUMMARY_SIZE,

  /**
   * The point fields of a request body, including the legacy position fields
   * so that validatePointInput() can refuse them. Undefined when not sent.
   *
   * @param {Object} req
   * @returns {Object}
   */
  readPointParams: (req) =>
    Object.fromEntries(
      [...UPDATABLE_FIELDS, ...LEGACY_POSITION_FIELDS].map((field) => [
        field,
        req.param(field),
      ])
    ),

  /**
   * Validate the body of a point creation (no `currentPoint`) or of a partial
   * update (PATCH, `currentPoint` set) and build the values to store.
   *
   * On creation, `label` and `underground` are required. On update, every
   * field is optional but at least one must be provided, and the omitted
   * fields keep their current value. Either way the resulting point is
   * validated: a complete pair of coordinates or none, and coordinates for a
   * surface point.
   *
   * @param {Object} params - { label, caveId, underground, latitude, longitude }
   *   plus any legacy position field the client sent
   * @param {Object} [currentPoint] - the stored point, for a partial update
   * @param {Object} [db] - the transaction connection the caller holds, if
   *   any: every lookup then runs on it rather than waiting for another
   *   connection of the pool
   * @returns {Promise<{error: string}|{data: Object}>}
   */
  validatePointInput: async (params, currentPoint = null, db = null) => {
    const isUpdate = currentPoint !== null;
    const { label, caveId, underground, latitude, longitude } = params;

    const legacyField = LEGACY_POSITION_FIELDS.find(
      (field) => params[field] !== undefined
    );
    if (legacyField) {
      return {
        error: `${legacyField} is not a point field: positions on SVG documents are managed through PUT and DELETE /api/v1/points/{id}/positions/{documentId}.`,
      };
    }

    if (isUpdate && UPDATABLE_FIELDS.every((f) => params[f] === undefined)) {
      return {
        error: `You must provide at least one updatable field (${UPDATABLE_FIELDS.join(
          ', '
        )}).`,
      };
    }

    const data = {};

    if (!isUpdate || label !== undefined) {
      const labelError = validateLabel(label);
      if (labelError) return { error: labelError };
      data.label = label.trim();
    }

    if (caveId !== undefined) {
      const caveError = await validateCave(caveId, db);
      if (caveError) return { error: caveError };
      data.cave = caveId;
    }

    // An explicit boolean on creation; on update, omitted keeps the current
    // value, and null is refused: a classified point is not unclassified again.
    if (!isUpdate || underground !== undefined) {
      if (typeof underground !== 'boolean') {
        return {
          error: isUpdate
            ? 'underground must be true or false.'
            : 'You must state whether the point is underground: underground must be true or false.',
        };
      }
      data.underground = underground;
    }

    const latitudeError =
      latitude !== undefined && validateCoordinate('latitude', latitude, 90);
    if (latitudeError) return { error: latitudeError };
    const longitudeError =
      longitude !== undefined &&
      validateCoordinate('longitude', longitude, 180);
    if (longitudeError) return { error: longitudeError };

    const resultingLocation = {
      underground:
        underground !== undefined
          ? underground
          : (currentPoint?.underground ?? null),
      latitude:
        latitude !== undefined
          ? latitude
          : toNullableNumber(currentPoint?.latitude),
      longitude:
        longitude !== undefined
          ? longitude
          : toNullableNumber(currentPoint?.longitude),
    };
    const locationError = validateResultingLocation(resultingLocation);
    if (locationError) return { error: locationError };

    // t_point stores coordinates as numeric, read and written as strings.
    if (latitude !== undefined) {
      data.latitude = latitude === null ? null : String(latitude);
    }
    if (longitude !== undefined) {
      data.longitude = longitude === null ? null : String(longitude);
    }

    return { data };
  },

  /**
   * Validate and create a point on one transaction connection: the cave it
   * references stays locked until the point is written (#1982).
   *
   * @param {Object} params - as returned by readPointParams()
   * @param {number} authorId
   * @returns {Promise<{error: string}|{point: Object}>}
   */
  createPoint: async (params, authorId) =>
    sails.getDatastore().transaction(async (db) => {
      const { error, data } = await module.exports.validatePointInput(
        params,
        null,
        db
      );
      if (error) return { error };
      const point = await TPoint.create({
        ...data,
        author: authorId,
        dateInscription: new Date(),
      })
        .fetch()
        .usingConnection(db);
      return { point };
    }),

  /**
   * Apply a partial update (PATCH) to a point. The point is locked, validated
   * and written on one transaction connection: concurrent updates of the same
   * point are serialized, and each one validates against the values the
   * previous one stored. Validating against an unlocked read would let two
   * valid updates combine into an invalid point, for instance a surface point
   * without coordinates.
   *
   * Every query of the transaction, validation included, runs on its
   * connection: a lookup on another connection of the pool could wait for
   * one while every connection is held by a transaction waiting for it.
   *
   * @param {number} pointId
   * @param {Object} params - as returned by readPointParams()
   * @param {number} reviewerId
   * @returns {Promise<{notFound: true}|{error: string}|{ok: true}>}
   */
  updatePoint: async (pointId, params, reviewerId) =>
    sails.getDatastore().transaction(async (db) => {
      // The cave before the point, in the lock order of CaveLifecycleService:
      // a lifecycle operation holding this cave and waiting for the point
      // would otherwise wait for this transaction while it waits for the cave.
      // validatePointInput() checks the cave again on this same lock.
      if (isValidId(params.caveId)) {
        await CaveLifecycleService.lockCaveForScientificWrite(
          params.caveId,
          db
        );
      }
      await sails
        .sendNativeQuery('SELECT id FROM t_point WHERE id = $1 FOR UPDATE', [
          pointId,
        ])
        .usingConnection(db);
      // Read after the lock: under READ COMMITTED, this statement sees the
      // values committed by the update that held it.
      const point = await TPoint.findOne({ id: pointId }).usingConnection(db);
      if (!point || point.isDeleted) return { notFound: true };

      const { error, data } = await module.exports.validatePointInput(
        params,
        point,
        db
      );
      if (error) return { error };

      await TPoint.updateOne({ id: pointId })
        .set({ ...data, reviewer: reviewerId, dateReviewed: new Date() })
        .usingConnection(db);
      return { ok: true };
    }),

  /**
   * Validate the coordinates of a position and the document it is on.
   *
   * @param {number} documentId
   * @param {Object} params - { x, y }
   * @returns {Promise<{error: string, status: 'badRequest'|'notFound'}|{data: {x: number, y: number}}>}
   */
  validatePositionInput: async (documentId, { x, y }) => {
    if (!isFiniteNumber(x) || !isFiniteNumber(y)) {
      return {
        status: 'badRequest',
        error: 'x and y must be finite numbers.',
      };
    }
    const document = await TDocument.findOne({
      id: documentId,
      isDeleted: false,
    });
    if (!document) {
      return {
        status: 'notFound',
        error: `Document of id ${documentId} not found.`,
      };
    }
    if (!POSITION_DOCUMENT_TYPE_IDS.includes(document.type)) {
      return {
        status: 'badRequest',
        error: `Document of id ${documentId} is not a plan: a point can only be positioned on a topographic drawing, topographic data or a map.`,
      };
    }
    return { data: { x, y } };
  },

  /**
   * Create or replace the position of a point on a document, in one statement:
   * concurrent requests for the same (point, document) cannot create two rows.
   *
   * @returns {Promise<{position: Object, created: boolean}>}
   */
  upsertPosition: async (pointId, documentId, { x, y }) => {
    const result = await sails.sendNativeQuery(
      `INSERT INTO j_point_document_position
         (id_point, id_document, x, y, date_inscription)
       VALUES ($1, $2, $3, $4, now())
       ON CONFLICT (id_point, id_document)
       DO UPDATE SET x = EXCLUDED.x, y = EXCLUDED.y, date_reviewed = now()
       RETURNING id_point, id_document, x, y, date_inscription, date_reviewed,
         (xmax = 0) AS created`,
      [pointId, documentId, x, y]
    );
    const row = result.rows[0];
    return {
      created: row.created,
      position: {
        point: row.id_point,
        document: row.id_document,
        x: row.x,
        y: row.y,
        dateInscription: row.date_inscription,
        dateReviewed: row.date_reviewed,
      },
    };
  },

  /**
   * The positions of a point on non-deleted documents, by document id.
   *
   * @param {number} pointId
   * @param {Object} [page] - { skip, limit }; every position when omitted
   * @returns {Promise<{positions: Object[], total: number}>}
   */
  getPointPositions: async (pointId, { skip = 0, limit } = {}) => {
    const allPositions = await JPointDocumentPosition.find({
      where: { point: pointId },
      select: ['document'],
    });
    const documentIds = allPositions.map((p) => p.document);
    const liveDocumentIds =
      documentIds.length === 0
        ? []
        : (
            await TDocument.find({
              where: { id: documentIds, isDeleted: false },
              select: ['id'],
            })
          ).map((d) => d.id);

    const where = { point: pointId, document: liveDocumentIds };
    let query = JPointDocumentPosition.find(where).sort('document ASC');
    if (skip) query = query.skip(skip);
    if (limit !== undefined) query = query.limit(limit);
    const [positions, total] = await Promise.all([
      liveDocumentIds.length === 0 ? [] : query,
      liveDocumentIds.length === 0 ? 0 : JPointDocumentPosition.count(where),
    ]);
    return {
      positions: await module.exports.withDocumentSummaries(positions),
      total,
    };
  },

  /**
   * Replace the document id of each position with the document, populated
   * with what a client needs to list and open it (type, title, validated
   * files), in one query per relation for the whole page rather than one
   * request per position.
   *
   * @param {Object[]} positions - positions whose `document` is an id
   * @returns {Promise<Object[]>} the same positions, `document` populated
   */
  withDocumentSummaries: async (positions) => {
    if (positions.length === 0) return positions;
    const documents = await TDocument.find({
      where: { id: positions.map((p) => p.document) },
      select: ['id'],
    })
      .populate('type')
      .populate('descriptions')
      .populate('files', { where: { isValidated: true }, sort: 'id ASC' });
    const documentById = new Map(documents.map((d) => [d.id, d]));
    return positions.map((position) => ({
      ...position,
      document: documentById.get(position.document) ?? position.document,
    }));
  },

  /**
   * Get a point with a bounded summary of its positions and the non-deleted
   * documents attached to it.
   *
   * @param {number} pointId
   * @returns {Promise<Object|null>} the populated point, or null
   */
  getPopulatedPoint: async (pointId) => {
    const point = await TPoint.findOne({ id: pointId })
      .populate('author')
      .populate('reviewer');
    if (!point) return null;

    const [{ positions, total }, documents] = await Promise.all([
      module.exports.getPointPositions(pointId, {
        limit: POSITIONS_SUMMARY_SIZE,
      }),
      TDocument.find({ point: pointId, isDeleted: false })
        .sort('id ASC')
        .populate('type')
        .populate('descriptions')
        .populate('files', { where: { isValidated: true } }),
    ]);

    point.positions = positions;
    point.positionCount = total;
    point.documents = documents;
    return point;
  },

  /**
   * The non-deleted points positioned on a document: the markers of its SVG.
   *
   * @param {number} documentId
   * @returns {Promise<Object[]>} { id, label, x, y }, by point id
   */
  getPointsOnDocument: async (documentId) => {
    const positions = await JPointDocumentPosition.find({
      document: documentId,
    });
    if (positions.length === 0) return [];
    const points = await TPoint.find({
      where: { id: positions.map((p) => p.point), isDeleted: false },
      select: ['id', 'label'],
    }).sort('id ASC');
    const positionByPoint = new Map(positions.map((p) => [p.point, p]));
    return points.map((point) => ({
      id: point.id,
      label: point.label,
      x: positionByPoint.get(point.id).x,
      y: positionByPoint.get(point.id).y,
    }));
  },
};
