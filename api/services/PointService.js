const isValidId = require('../utils/isValidId');

// Document types a point can be drawn on (sql/2_2021_09_26_1_doc_types.sql):
// Topographic Drawing, Topographic Data and Map.
const REFERENCE_DOCUMENT_TYPE_IDS = [13, 14, 19];

const LABEL_MAX_LENGTH = 200;

const POSITION_FIELDS = ['referenceDocumentId', 'x', 'y'];

const isFiniteNumber = (value) =>
  typeof value === 'number' && Number.isFinite(value);

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
 * @returns {Promise<string|null>} an error message, or null when valid
 */
const validateCave = async (caveId) => {
  if (caveId === null) return null;
  if (!isValidId(caveId)) {
    return 'caveId must be a positive integer or null.';
  }
  const cave = await TCave.findOne({ id: caveId, isDeleted: false });
  if (!cave) return `Cave of id ${caveId} not found.`;
  return null;
};

/**
 * Validate the position of a point on its reference SVG (relation A).
 * The three fields go together: all null clears the position, all set
 * positions the point on a plan document.
 * @returns {Promise<string|null>} an error message, or null when valid
 */
const validatePosition = async ({ referenceDocumentId, x, y }) => {
  const values = [referenceDocumentId, x, y];
  if (values.some((v) => v === undefined)) {
    return `${POSITION_FIELDS.join(', ')} must be provided together.`;
  }
  const nullCount = values.filter((v) => v === null).length;
  if (nullCount === 3) return null;
  if (nullCount > 0) {
    return `${POSITION_FIELDS.join(', ')} must be all set or all null.`;
  }
  if (!isValidId(referenceDocumentId)) {
    return 'referenceDocumentId must be a positive integer.';
  }
  if (!isFiniteNumber(x) || !isFiniteNumber(y)) {
    return 'x and y must be finite numbers.';
  }
  const document = await TDocument.findOne({
    id: referenceDocumentId,
    isDeleted: false,
  });
  if (!document) {
    return `Document of id ${referenceDocumentId} not found.`;
  }
  if (!REFERENCE_DOCUMENT_TYPE_IDS.includes(document.type)) {
    return `Document of id ${referenceDocumentId} is not a plan: a point can only be positioned on a topographic drawing, topographic data or a map.`;
  }
  return null;
};

module.exports = {
  REFERENCE_DOCUMENT_TYPE_IDS,
  LABEL_MAX_LENGTH,

  /**
   * Validate the body of a point creation or update and build the values to
   * store. On update (`isUpdate`), every field is optional but at least one
   * must be provided.
   *
   * @param {Object} params - { label, caveId, referenceDocumentId, x, y }
   * @param {Object} [options]
   * @param {boolean} [options.isUpdate=false]
   * @returns {Promise<{error: string}|{data: Object}>}
   */
  validatePointInput: async (params, { isUpdate = false } = {}) => {
    const { label, caveId, referenceDocumentId, x, y } = params;
    const data = {};

    if (
      isUpdate &&
      [label, caveId, referenceDocumentId, x, y].every((v) => v === undefined)
    ) {
      return {
        error:
          'You must provide at least one updatable field (label, caveId, referenceDocumentId, x, y).',
      };
    }

    if (!isUpdate || label !== undefined) {
      const labelError = validateLabel(label);
      if (labelError) return { error: labelError };
      data.label = label.trim();
    }

    if (caveId !== undefined) {
      const caveError = await validateCave(caveId);
      if (caveError) return { error: caveError };
      data.cave = caveId;
    }

    const isPositionProvided = [referenceDocumentId, x, y].some(
      (v) => v !== undefined
    );
    if (isPositionProvided) {
      const positionError = await validatePosition({
        referenceDocumentId,
        x,
        y,
      });
      if (positionError) return { error: positionError };
      data.referenceDocument = referenceDocumentId;
      data.x = x;
      data.y = y;
    }

    return { data };
  },

  /**
   * Get a point with its reference document (relation A) and the
   * non-deleted documents that reference it (relation B).
   *
   * @param {number} pointId
   * @returns {Promise<Object|null>} the populated point, or null
   */
  getPopulatedPoint: async (pointId) => {
    const point = await TPoint.findOne({ id: pointId })
      .populate('author')
      .populate('reviewer');
    if (!point) return null;

    const populateSimpleDocument = (query) =>
      query
        .populate('type')
        .populate('descriptions')
        .populate('files', { where: { isValidated: true } });

    const [referenceDocument, documents] = await Promise.all([
      point.referenceDocument
        ? populateSimpleDocument(
            TDocument.findOne({ id: point.referenceDocument })
          )
        : null,
      populateSimpleDocument(
        TDocument.find({ point: pointId, isDeleted: false }).sort('id ASC')
      ),
    ]);

    point.referenceDocument = referenceDocument ?? null;
    point.documents = documents;
    return point;
  },

  /**
   * The non-deleted points drawn on a document: the markers of its SVG plan.
   *
   * @param {number} documentId
   * @returns {Promise<Object[]>}
   */
  getPointsOnDocument: async (documentId) =>
    TPoint.find({
      where: { referenceDocument: documentId, isDeleted: false },
      select: ['id', 'label', 'x', 'y'],
    }).sort('id ASC'),
};
