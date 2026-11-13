/**
 * Custom configuration
 * (sails.config.custom)
 *
 * One-off settings specific to your application.
 *
 * For more information on custom configuration, visit:
 * https://sailsjs.com/config/custom
 */

const botSurfaceConfig = require('../api/utils/botSurfaceConfig');

module.exports.custom = {
  /** ************************************************************************
   *                                                                         *
   * The base URL to use during development.                                 *
   *                                                                         *
   * • No trailing slash at the end                                          *
   * • `http://` or `https://` at the beginning.                             *
   *                                                                         *
   * > This is for use in custom logic that builds URLs.                     *
   * > It is particularly handy for building dynamic links in emails,        *
   * > but it can also be used for user-uploaded images, webhooks, etc.      *
   *                                                                         *
   ************************************************************************* */
  baseUrl: 'http://localhost:3000', // client URL

  /** *************************************************************************************
   *                                                                                      *
   * The TTL (time-to-live) for various sorts of tokens before they expire (in seconds).  *
   *                                                                                      *
   *************************************************************************************** */
  authTokenTTL: 90 * 24 * 60 * 60, // 90 days
  passwordResetTokenTTL: 24 * 60 * 60, // 24 hours

  /** ************************************************************************
   *                                                                         *
   * The extended length that browsers should retain the session cookie      *
   * if "Remember Me" was checked while logging in.                          *
   *                                                                         *
   ************************************************************************* */
  // rememberMeCookieMaxAge: 30 * 24 * 60 * 60 * 1000, // 30 days

  /** ************************************************************************
   *                                                                         *
   * Automated email configuration                                           *
   *                                                                         *
   * Sandbox Mailgun credentials for use during development, as well as any  *
   * other default settings related to "how" and "where" automated emails    *
   * are sent.                                                               *
   *                                                                         *
   * (https://app.mailgun.com/app/domains)                                   *
   *                                                                         *
   ************************************************************************* */
  // mailgunDomain: 'sandboxaa1234fake678.mailgun.org',
  // mailgunSecret: 'key-fakeb183848139913858e8abd9a3',
  //--------------------------------------------------------------------------
  // /\  Configure these to enable support for automated emails.
  // ||  (Important for password recovery, verification, contact form, etc.)
  //--------------------------------------------------------------------------

  // The sender that all outgoing emails will appear to come from.
  fromEmailAddress: 'Grottocenter <underground_bot@grottocenter.org>',

  // Email address for receiving support messages & other correspondences.
  internalEmailAddress: 'Grottocenter <info@grottocenter.org>',

  // Whether to require proof of email address ownership any time a new user
  // signs up, or when an existing user attempts to change their email address.
  verifyEmailAddresses: false,

  /** ************************************************************************
   *                                                                         *
   * Billing & payments configuration                                        *
   *                                                                         *
   * (https://dashboard.stripe.com/account/apikeys)                          *
   *                                                                         *
   ************************************************************************* */
  // stripePublishableKey: 'pk_test_Zzd814nldl91104qor5911gjald',
  // stripeSecret: 'sk_test_Zzd814nldl91104qor5911gjald',
  //--------------------------------------------------------------------------
  // /\  Configure these to enable support for billing features.
  // ||  (Or if you don't need billing, feel free to remove them.)
  //--------------------------------------------------------------------------

  /** *************************************************************************
   *                                                                          *
   * Any other custom config this Sails app should use during development.    *
   *                                                                          *
   ************************************************************************** */
  // …

  /** *************************************************************************
   *                                                                          *
   * TTL (in seconds) for the in-memory coordinates snapshot used by the      *
   * geoloc entrances coordinates endpoint. After this duration, a background *
   * refresh is triggered.                                                    *
   *                                                                          *
   ************************************************************************** */
  coordinatesSnapshotTTL: 86400, // 24 hours

  /** *************************************************************************
   *                                                                          *
   * Static pages published for indexing bots (docs/bot-surface.md).          *
   *                                                                          *
   * enabled: the background jobs of the bot surface run only when this is   *
   *   true (BOT_SURFACE_ENABLED=true; off by default): the withdrawal worker *
   *   (BotOutboxQueueService) and the SCHEDULE of the nightly pipeline      *
   *   (BotPipelineQueueService). A manual run does not need it.             *
   * entityTypes: the allow-list (BOT_SURFACE_ENTITY_TYPES, comma-separated   *
   *   among cave, massif, organization, hub). Only these are published; the  *
   *   pages of any other type are deleted by the next run. Unset or empty    *
   *   means nothing is generated and the pipeline does not run. An unknown   *
   *   name stops the startup.                                                *
   * schedule: cron expression, UTC, of the nightly pipeline                  *
   *   (BOT_SURFACE_SCHEDULE; default 30 1 * * *, provisional).               *
   * publicBaseUrl: the SPA's own address; a page lives at                    *
   *   <publicBaseUrl>/caves/123 (BOT_PAGES_PUBLIC_BASE_URL).                 *
   * storage.driver: 'local' (dev, default) or 'azure' (BOT_PAGES_STORAGE).   *
   *   local: pages are written under BOT_PAGES_LOCAL_DIR.                    *
   *   azure: BOT_PAGES_AZURE_CONNECTION_STRING and BOT_PAGES_AZURE_CONTAINER *
   *          (the static website container, `$web`); both are required.      *
   * audit: the nightly audit of what is online (#1887): sampleSize           *
   *   (BOT_AUDIT_SAMPLE_SIZE, 1000), failureLimit (BOT_AUDIT_FAILURE_LIMIT,  *
   *   10), variantSample (BOT_AUDIT_VARIANT_SAMPLE, 20, 0 disables) and      *
   *   timeBudgetMs (BOT_AUDIT_TIME_BUDGET_MS, 30 minutes). An invalid value  *
   *   stops the startup.                                                     *
   *                                                                          *
   ************************************************************************** */
  botSurface: {
    enabled: process.env.BOT_SURFACE_ENABLED === 'true',
    entityTypes: botSurfaceConfig.parseEntityTypes(
      process.env.BOT_SURFACE_ENTITY_TYPES
    ),
    schedule: botSurfaceConfig.parseSchedule(process.env.BOT_SURFACE_SCHEDULE),
    // The nightly audit (#1887): BOT_AUDIT_SAMPLE_SIZE, BOT_AUDIT_FAILURE_LIMIT,
    // BOT_AUDIT_VARIANT_SAMPLE, BOT_AUDIT_TIME_BUDGET_MS (see docs/bot-surface.md)
    audit: botSurfaceConfig.parseAuditConfig(),
    publicBaseUrl:
      process.env.BOT_PAGES_PUBLIC_BASE_URL || 'https://grottocenter.org/ui',
    storage: {
      driver: process.env.BOT_PAGES_STORAGE || 'local',
      localDir: process.env.BOT_PAGES_LOCAL_DIR || '.local-bot-pages',
      azureConnectionString: process.env.BOT_PAGES_AZURE_CONNECTION_STRING,
      azureContainer: process.env.BOT_PAGES_AZURE_CONTAINER,
    },
  },

  /** *************************************************************************
   *                                                                          *
   * Minimum delay (in seconds) between a failed coordinates snapshot load    *
   * and the next automatic attempt. invalidate() ignores it.                 *
   *                                                                          *
   ************************************************************************** */
  coordinatesSnapshotRetryDelay: 300, // 5 minutes

  /** *************************************************************************
   *                                                                          *
   * Authentication settings.                                                 *
   *                                                                          *
   ************************************************************************** */
  authBruteForceDelay: 500, // ms — delay before responding to login attempts
  authFailureDelay: 200, // ms — constant-time delay on failed logins to prevent timing-based admin enumeration
  argon2Options: {}, // use argon2 defaults (see config/env/test.js for overrides)

  /** *************************************************************************
   *                                                                          *
   * Admin security & MFA settings.                                           *
   *                                                                          *
   ************************************************************************** */

  // --- TTLs (seconds) ---
  adminAuthTokenTTL: 864000, // 10 days in seconds
  mfaEnrollmentTokenTTL: 600, // 10 minutes in seconds

  // --- MFA config ---
  mfaIssuerName: 'Grottocenter',
  mfaEncryptionKey: process.env.MFA_ENCRYPTION_KEY,

  // --- Thresholds (counts) ---
  adminLoginFailureThreshold: 5,
  adminTotpFailureThreshold: 5,
  suspiciousActivityEmailThreshold: 3,

  // --- Cooldowns (milliseconds) ---
  suspiciousActivityEmailCooldown: 900000, // 15 minutes in milliseconds

  /** *************************************************************************
   *                                                                          *
   * Health check settings.                                                   *
   *                                                                          *
   ************************************************************************** */
  // Per-dependency budget for GET /api/v1/health. Keep it well under the 30s
  // timeout of the external uptime monitor.
  healthCheckTimeoutMs: 5000,
};
