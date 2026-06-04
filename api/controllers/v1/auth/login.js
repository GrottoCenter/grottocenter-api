const AuthService = require('../../../services/AuthService');
const TokenService = require('../../../services/TokenService');
const CaverService = require('../../../services/CaverService');
const RightService = require('../../../services/RightService');
const MfaService = require('../../../services/MfaService');
const AdminLoginProtectionService = require('../../../services/AdminLoginProtectionService');

// Constant-time delay (ms) applied to all failed-login responses to prevent
// timing-based enumeration of admin accounts (issue: DB lookup for admin
// failure tracking adds measurable latency only for existing admin emails).
// Configurable via sails.config.custom.authFailureDelay (default: 200ms).

/**
 * Delay execution by a fixed amount to normalize response timing.
 */
function constantDelay() {
  const delayMs = sails.config.custom.authFailureDelay || 200;
  return new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });
}

module.exports = async (req, res) => {
  const { email, password } = req.body;

  if (!CaverService.isARealCaver(email)) {
    return res.unauthorized({
      status: 'Mismatch',
      message: 'Invalid email or password.',
    });
  }

  const result = await AuthService.authenticate(email, password);

  if (result.status === AuthService.authenticateResult.MISMATCH) {
    // For admin accounts, record the failed login attempt.
    // The constant delay normalizes response timing regardless of whether
    // the email belongs to an admin (prevents timing-based enumeration).
    // Use req.adminCaver (stashed by adminAuthRateLimit middleware) to avoid
    // a redundant DB lookup.
    if (email) {
      const caverByEmail =
        req.adminCaver ||
        (await (async () => {
          const c = await TCaver.findOne({
            mail: email.toLowerCase(),
          }).populate('groups');
          return c &&
            RightService.hasGroup(c.groups, RightService.G.ADMINISTRATOR)
            ? c
            : null;
        })());
      if (caverByEmail) {
        await AdminLoginProtectionService.recordFailedLogin(
          caverByEmail,
          req.ip
        );
      }
    }
    await constantDelay();
    return res.unauthorized({
      status: 'Mismatch',
      message: 'Invalid email or password.',
    });
  }
  if (result.status === AuthService.authenticateResult.MUST_RESET) {
    return res.unauthorized({
      status: 'MustReset',
      message: 'Password needs to be reset',
    });
  }

  if (result.status === AuthService.authenticateResult.NOT_VERIFIED) {
    return res.unauthorized({
      status: 'NotVerified',
      message:
        'Your account is not verified yet. Please check your email for the verification link.',
    });
  }

  if (result.status === AuthService.authenticateResult.BANNED) {
    // Update login metadata for a banned connection attempt (unit tests require it)
    CommonService.query(
      `UPDATE t_caver SET date_last_connection = NOW(), connection_counter = connection_counter + 1 WHERE id = $1`,
      [result.user.id]
    ).catch((e) =>
      sails.log.error('Failed to update login metadata:', e.message)
    );

    return res.unauthorized({
      status: 'Mismatch',
      message: 'Invalid email or password.',
    });
  }

  // If we get to this code block, authenticateResult is necessarily SUCCESS
  const isAdmin = RightService.hasGroup(
    result.user.groups,
    RightService.G.ADMINISTRATOR
  );
  const tokenTTL = isAdmin
    ? sails.config.custom.adminAuthTokenTTL || sails.config.custom.authTokenTTL
    : sails.config.custom.authTokenTTL;

  // MFA flow for admin users
  if (isAdmin) {
    // Load full caver record to get MFA fields
    const caver = await TCaver.findOne({ id: result.user.id });

    // Check if account is banned before proceeding with MFA flow
    if (AdminLoginProtectionService.isAccountBanned(caver)) {
      return res.unauthorized({
        status: 'Mismatch',
        message: 'Invalid email or password.',
      });
    }

    if (!caver.mfaEnabled) {
      // Admin without MFA enrolled → reset counters and issue restricted enrollment token
      await AdminLoginProtectionService.resetCounters(caver.id);
      const enrollmentToken = TokenService.issue(
        {
          id: result.user.id,
          groups: result.user.groups,
          nickname: result.user.nickname,
        },
        sails.config.custom.mfaEnrollmentTokenTTL,
        'MfaEnrollment'
      );
      return res.unauthorized({
        status: 'MfaEnrollmentRequired',
        enrollmentToken,
      });
    }

    // Admin with MFA active
    const { totpCode } = req.body;

    if (!totpCode) {
      // No TOTP code provided → prompt for it
      return res.unauthorized({
        status: 'MfaRequired',
        message: 'TOTP code is required.',
      });
    }

    // Check replay
    if (MfaService.isReplay(totpCode, caver)) {
      const totpResult =
        await AdminLoginProtectionService.recordFailedTotp(caver);
      if (totpResult.banned) {
        return res.unauthorized({
          status: 'Mismatch',
          message: 'Invalid email or password.',
        });
      }
      return res.unauthorized({
        status: 'TotpAlreadyUsed',
        message: 'This code has already been used.',
      });
    }

    // Decrypt secret and verify code
    if (!caver.totpSecret) {
      sails.log.error(
        `MFA enabled for caver ${caver.id} but totpSecret is null`
      );
      return res.serverError('MFA secret unavailable.');
    }
    const secret = MfaService.decryptSecret(caver.totpSecret);
    const isValid = await MfaService.verifyCode(totpCode, secret);

    if (!isValid) {
      const totpResult =
        await AdminLoginProtectionService.recordFailedTotp(caver);
      if (totpResult.banned) {
        return res.unauthorized({
          status: 'Mismatch',
          message: 'Invalid email or password.',
        });
      }
      return res.unauthorized({
        status: 'InvalidTotpCode',
        message: 'The TOTP code is invalid.',
      });
    }

    // TOTP verification succeeded — atomically update lastUsedTotp fields
    // using a WHERE clause to prevent race conditions (two concurrent requests
    // with the same valid code). If the update affects 0 rows, another request
    // already consumed this code.
    const updated = await TCaver.update({
      id: caver.id,
      lastUsedTotp: caver.lastUsedTotp, // optimistic lock
    })
      .set({
        lastUsedTotp: totpCode,
        lastUsedTotpAt: new Date(),
      })
      .fetch();

    if (updated.length === 0) {
      // Another concurrent request already used this code
      return res.unauthorized({
        status: 'TotpAlreadyUsed',
        message: 'This code has already been used.',
      });
    }
    await AdminLoginProtectionService.resetCounters(caver.id);
  }

  // Issue full auth token (admins who passed MFA, or non-admins)
  const token = TokenService.issue(
    {
      id: result.user.id,
      groups: result.user.groups,
      nickname: result.user.nickname,
    },
    tokenTTL,
    'Authentication'
  );

  // Update login metadata (fire-and-forget)
  CommonService.query(
    `UPDATE t_caver SET date_last_connection = NOW(), connection_counter = connection_counter + 1 WHERE id = $1`,
    [result.user.id]
  ).catch((e) =>
    sails.log.error('Failed to update login metadata:', e.message)
  );

  return res.json({ status: 'Success', token });
};
