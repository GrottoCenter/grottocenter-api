/**
 * SsoService.js
 *
 * @description :: Product-agnostic SSO token issuance for cross-origin
 *                 Just-In-Time authentication with external products.
 *                 Each registered product has its own signing secret
 *                 resolved from a dedicated environment variable.
 */

const crypto = require('crypto');
const jwt = require('jsonwebtoken');

/**
 * Product registry mapping product identifiers to their
 * corresponding environment variable names for signing secrets.
 * To onboard a new product: add an entry here and set the env var.
 */
const PRODUCT_REGISTRY = {
  superset: 'SSO_SALT_SUPERSET',
};

const SSO_TOKEN_TTL = 30; // seconds

// Local dev fallback (matches SUPERSET_SSO_SECRET default in superset_config.py).
// Only used when NODE_ENV=development and the env var is not set.
const DEV_FALLBACK_SALT = 'aR4nd0mSs0DevSalt_change_in_prod';

/**
 * Resolve the signing salt for a given product.
 * @param {string} product - Product identifier from request body
 * @returns {{ salt: string } | { error: string, status: number }}
 */
function resolveSalt(product) {
  if (!product || typeof product !== 'string') {
    return {
      error: "The 'product' field is required and must be a string.",
      status: 400,
    };
  }

  if (!Object.hasOwn(PRODUCT_REGISTRY, product)) {
    return {
      error: `Product '${product}' is not supported.`,
      status: 400,
    };
  }
  const envVarName = PRODUCT_REGISTRY[product];

  const salt = process.env[envVarName];
  if (!salt || !salt.trim()) {
    // In development, fall back to a shared dev secret (must match Superset side)
    if (process.env.NODE_ENV === 'development') {
      return { salt: DEV_FALLBACK_SALT };
    }
    sails.log.error(
      `SsoService: signing secret not configured for product '${product}' (env var: ${envVarName})`
    );
    return {
      error: 'Server configuration error.',
      status: 500,
    };
  }

  return { salt };
}

/**
 * Build the SSO token payload for a caver and product.
 * Uses synthetic email ({id}@grottocenter.org) to avoid PII exposure.
 *
 * @param {Object} caver - Caver record (must have id; may have name, surname)
 * @param {string} product - Product identifier (used as `aud` claim)
 * @returns {Object} JWT payload
 */
function buildPayload(caver, product) {
  return {
    sub: caver.id,
    aud: product,
    email: `${caver.id}@grottocenter.org`,
    firstName: caver.name || '',
    lastName: caver.surname || '',
    jti: crypto.randomUUID(),
  };
}

/**
 * Issue an SSO token for the given caver and product.
 * @param {Object} caver - Caver record (id, name, surname)
 * @param {string} product - Product identifier
 * @returns {{ token: string } | { error: string, status: number }}
 */
function issueToken(caver, product) {
  const saltResult = resolveSalt(product);
  if (saltResult.error) {
    return saltResult;
  }

  const payload = buildPayload(caver, product);
  const token = jwt.sign(payload, saltResult.salt, {
    algorithm: 'HS256',
    expiresIn: SSO_TOKEN_TTL,
  });

  return { token };
}

module.exports = {
  PRODUCT_REGISTRY,
  SSO_TOKEN_TTL,
  resolveSalt,
  buildPayload,
  issueToken,
};
