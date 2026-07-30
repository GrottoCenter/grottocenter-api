/**
 * TurnstileService.js
 *
 * @description :: Verifies Cloudflare Turnstile CAPTCHA tokens by calling the
 *                 Cloudflare siteverify API. Designed as a reusable service for
 *                 any endpoint that needs bot protection (signup, login, etc.).
 *
 *                 Configuration via environment variables:
 *                 - TURNSTILE_ENABLED: case-insensitive "true" enables verification
 *                 - TURNSTILE_SECRET_KEY: the secret key for siteverify API calls
 *
 *                 Fail-closed: any unexpected error returns CAPTCHA_SERVICE_UNAVAILABLE.
 */

const SITEVERIFY_URL =
  'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const TIMEOUT_MS = 3000;

/**
 * @typedef {Object} TurnstileResult
 * @property {boolean} pass - Whether verification passed
 * @property {string|null} errorCode - One of: CAPTCHA_MISSING, CAPTCHA_INVALID, CAPTCHA_SERVICE_UNAVAILABLE
 */

module.exports = {
  /**
   * Check if Turnstile verification is enabled.
   * @returns {boolean}
   */
  isEnabled() {
    const value = process.env.TURNSTILE_ENABLED;
    return typeof value === 'string' && value.toLowerCase() === 'true';
  },

  /**
   * Validate startup configuration. Call during app bootstrap.
   * Throws if TURNSTILE_ENABLED=true but TURNSTILE_SECRET_KEY is missing/empty.
   */
  validateConfig() {
    if (!this.isEnabled()) {
      return;
    }
    const secret = process.env.TURNSTILE_SECRET_KEY;
    if (!secret || secret.trim().length === 0) {
      throw new Error(
        'TURNSTILE_SECRET_KEY is required when TURNSTILE_ENABLED is set to true'
      );
    }
  },

  /**
   * Verify a Turnstile captcha token against the Cloudflare siteverify API.
   *
   * @param {string|undefined|null} token - The captchaToken from the request body
   * @param {string} clientIp - The client IP (req.ip)
   * @returns {Promise<TurnstileResult>}
   */
  async verifyToken(token, clientIp) {
    // Check for missing or whitespace-only token
    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      return { pass: false, errorCode: 'CAPTCHA_MISSING' };
    }

    // Cloudflare Turnstile tokens are bounded at ~2 KB; reject oversized values
    // before making an outbound call — cheap defense against log/payload abuse.
    if (token.length > 2048) {
      return { pass: false, errorCode: 'CAPTCHA_INVALID' };
    }

    const secret = process.env.TURNSTILE_SECRET_KEY;

    try {
      const response = await fetch(SITEVERIFY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          secret,
          response: token,
          remoteip: clientIp,
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });

      // Any non-2xx response means Cloudflare's siteverify is unavailable or
      // unreachable. Cloudflare always returns 200 for invalid tokens (with
      // success: false in the body), so a non-2xx is never a token error.
      if (!response.ok) {
        return { pass: false, errorCode: 'CAPTCHA_SERVICE_UNAVAILABLE' };
      }

      const data = await response.json();

      if (data.success === true) {
        return { pass: true, errorCode: null };
      }

      return { pass: false, errorCode: 'CAPTCHA_INVALID' };
    } catch {
      // Network error, timeout (AbortError), or any unexpected error
      return { pass: false, errorCode: 'CAPTCHA_SERVICE_UNAVAILABLE' };
    }
  },
};
