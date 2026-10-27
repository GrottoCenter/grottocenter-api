/**
 * Allow-list of the fields the bot-indexing pages may publish.
 *
 * A field is published only if it is named here, per entity type and level:
 * a column added to a model or view later stays unpublished until someone adds
 * it below on purpose. Never derive the output by copying a row and removing
 * keys.
 *
 * Levels:
 *  - top:    the entity is the subject of the page (an entrance is embedded in
 *            its cave's page and uses its `top` set).
 *  - nested: the entity is linked from another entity's page.
 *
 * Never published, at any level: coordinates and geometry, the protection
 * status (isSensitive, isSensitiveLocked), anything derived from t_caver,
 * bookkeeping columns, and t_location / t_comment text. Free text is limited to
 * t_description, already cleared by the caller.
 *
 * This module does not decide which entities are published. Sensitive
 * entrances are filtered out before projection, in v_bot_page (#1759), because
 * `isSensitive` is never part of the output: every entity handed to project()
 * must already be publishable, and an unfiltered sensitive entrance would be
 * published with its locality.
 *
 * Pure: loads without Sails.
 */

// A key maps to null for a scalar, or to [entityType, level] for a nested
// entity (or an array of them) that is projected with its own set.
const SCALAR = null;
const child = (entityType, level) => Object.freeze([entityType, level]);

const SPEC = {
  description: {
    top: { title: SCALAR, body: SCALAR, language: SCALAR },
  },

  license: {
    top: { name: SCALAR, url: SCALAR },
  },

  subject: {
    top: { id: SCALAR, subject: SCALAR },
  },

  cave: {
    top: {
      id: SCALAR,
      name: SCALAR,
      language: SCALAR,
      depth: SCALAR,
      length: SCALAR,
      temperature: SCALAR,
      isDiving: SCALAR,
      lastmod: SCALAR,
      descriptions: child('description', 'top'),
      massifs: child('massif', 'nested'),
      entrances: child('entrance', 'top'),
    },
    nested: { id: SCALAR, name: SCALAR, depth: SCALAR, length: SCALAR },
  },

  entrance: {
    top: {
      id: SCALAR,
      name: SCALAR,
      language: SCALAR,
      city: SCALAR,
      county: SCALAR,
      region: SCALAR,
      country: SCALAR,
      discoveryYear: SCALAR,
      dangerCo2: SCALAR,
      dangerFlooding: SCALAR,
      dangerRockfall: SCALAR,
      dangerPollution: SCALAR,
      hasBat: SCALAR,
      needCleanGear: SCALAR,
      needStayOnTrail: SCALAR,
      hasRules: SCALAR,
      isTouristic: SCALAR,
      descriptions: child('description', 'top'),
    },
    nested: { id: SCALAR, name: SCALAR },
  },

  massif: {
    top: {
      id: SCALAR,
      name: SCALAR,
      language: SCALAR,
      lastmod: SCALAR,
      descriptions: child('description', 'top'),
      caves: child('cave', 'nested'),
    },
    nested: { id: SCALAR, name: SCALAR },
  },

  organization: {
    top: {
      id: SCALAR,
      name: SCALAR,
      language: SCALAR,
      city: SCALAR,
      county: SCALAR,
      region: SCALAR,
      country: SCALAR,
      url: SCALAR,
      yearBirth: SCALAR,
      lastmod: SCALAR,
    },
    nested: { id: SCALAR, name: SCALAR },
  },

  document: {
    top: {
      id: SCALAR,
      title: SCALAR,
      type: SCALAR,
      identifier: SCALAR,
      identifierType: SCALAR,
      datePublication: SCALAR,
      language: SCALAR,
      lastmod: SCALAR,
      subjects: child('subject', 'top'),
      license: child('license', 'top'),
      descriptions: child('description', 'top'),
      organizationAuthors: child('organization', 'nested'),
    },
    nested: { id: SCALAR, title: SCALAR },
  },
};

const deepFreeze = (value) => {
  if (value !== null && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
};

deepFreeze(SPEC);

/** Sorted field names per entity type and level. */
const WHITELIST = deepFreeze(
  Object.fromEntries(
    Object.entries(SPEC).map(([entityType, levels]) => [
      entityType,
      Object.fromEntries(
        Object.entries(levels).map(([level, fields]) => [
          level,
          Object.keys(fields).sort(),
        ])
      ),
    ])
  )
);

const hasOwn = (object, key) =>
  Object.prototype.hasOwnProperty.call(object, key);

const isPlainObject = (value) => {
  if (value === null || typeof value !== 'object') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
};

const isScalar = (value) =>
  value === null ||
  ['string', 'number', 'boolean'].includes(typeof value) ||
  value instanceof Date;

const getFields = (entityType, level) => {
  if (!hasOwn(SPEC, entityType) || !hasOwn(SPEC[entityType], level)) {
    throw new RangeError(
      `No bot-surface whitelist for entity type "${entityType}" at level "${level}"`
    );
  }
  return SPEC[entityType][level];
};

/**
 * Builds the publishable shape of a row from the keys the whitelist names.
 * A named key absent from the row is absent from the output. A scalar key
 * that holds an object is rejected rather than copied, because an unreviewed
 * structure could carry unlisted fields.
 *
 * @param {string} entityType e.g. 'cave'
 * @param {'top'|'nested'} level
 * @param {Object} row Plain object, e.g. a row of v_bot_page
 * @returns {Object}
 * @throws {RangeError} unknown (entityType, level)
 * @throws {TypeError} row is not a plain object, or a scalar key holds an object
 */
const describeType = (value) => (Array.isArray(value) ? 'array' : typeof value);

// `path` locates the row in error messages, e.g. cave.entrances[7].descriptions[0]
const build = (entityType, level, row, path) => {
  const fields = getFields(entityType, level);
  if (!isPlainObject(row)) {
    throw new TypeError(
      `Cannot project ${path} (${entityType}): expected a plain object, got ${describeType(
        row
      )}`
    );
  }

  const output = {};
  Object.entries(fields).forEach(([key, childSpec]) => {
    if (!hasOwn(row, key) || row[key] === undefined) return;
    const value = row[key];

    if (childSpec === SCALAR) {
      if (!isScalar(value)) {
        throw new TypeError(
          `Field "${path}.${key}" must be a scalar, got ${describeType(value)}`
        );
      }
      output[key] = value;
      return;
    }

    const [childType, childLevel] = childSpec;
    if (value === null) {
      output[key] = null;
    } else if (Array.isArray(value)) {
      output[key] = value.map((item, i) =>
        build(childType, childLevel, item, `${path}.${key}[${i}]`)
      );
    } else {
      output[key] = build(childType, childLevel, value, `${path}.${key}`);
    }
  });
  return output;
};

const project = (entityType, level, row) =>
  build(entityType, level, row, entityType);

module.exports = { WHITELIST, project };
