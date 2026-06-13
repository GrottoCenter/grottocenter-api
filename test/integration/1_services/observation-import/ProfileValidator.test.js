/**
 * Unit tests for ProfileValidator.
 *
 * Each test targets a specific validation rule with a concrete bad (or good)
 * profile. All errors are accumulated before returning, so tests that check
 * multiple simultaneous errors are included at the end.
 */
const should = require('should');
const ProfileValidator = require('../../../../api/services/observation-import/ProfileValidator');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** A minimal valid profile — use as a base and override individual fields. */
const validBase = () => ({
  timezone: 'Europe/Paris',
  authorIds: [1],
  licenseId: 1,
  caveId: 42,
  dateFormat: 'YYYY-MM-DD HH:mm:ss',
  columnMappings: [
    { columnIndex: 0, role: 'timestamp', timestampType: 'datetime' },
    { columnIndex: 1, role: 'measurement', sensorConfigurationId: 5 },
  ],
});

describe('ProfileValidator', () => {
  // -------------------------------------------------------------------------
  // Required fields
  // -------------------------------------------------------------------------
  describe('required field: timezone', () => {
    it('should return an error when timezone is missing', () => {
      const profile = validBase();
      delete profile.timezone;
      const errors = ProfileValidator.validate(profile);
      should(errors).be.an.Array();
      should(errors.some((e) => e.includes('timezone'))).be.true(
        `Expected error mentioning 'timezone', got: ${JSON.stringify(errors)}`
      );
    });

    it('should return an error when timezone is null', () => {
      const profile = { ...validBase(), timezone: null };
      const errors = ProfileValidator.validate(profile);
      should(errors.some((e) => e.includes('timezone'))).be.true();
    });

    it('should return an error when timezone is empty string', () => {
      const profile = { ...validBase(), timezone: '' };
      const errors = ProfileValidator.validate(profile);
      should(errors.some((e) => e.includes('timezone'))).be.true();
    });
  });

  describe('required field: columnMappings', () => {
    it('should return an error when columnMappings is missing', () => {
      const profile = validBase();
      delete profile.columnMappings;
      const errors = ProfileValidator.validate(profile);
      should(errors.some((e) => e.includes('columnMappings'))).be.true();
    });

    it('should return an error when columnMappings is null', () => {
      const profile = { ...validBase(), columnMappings: null };
      const errors = ProfileValidator.validate(profile);
      should(errors.some((e) => e.includes('columnMappings'))).be.true();
    });
  });

  describe('required field: authorIds', () => {
    it('should return an error when authorIds is missing', () => {
      const profile = validBase();
      delete profile.authorIds;
      const errors = ProfileValidator.validate(profile);
      should(errors.some((e) => e.includes('authorIds'))).be.true();
    });

    it('should not return an error when authorIds is a valid array', () => {
      const profile = validBase(); // has authorIds: [1]
      const errors = ProfileValidator.validate(profile);
      should(errors.some((e) => e.includes('authorIds'))).be.false();
    });

    it('should accept multiple author IDs', () => {
      const profile = { ...validBase(), authorIds: [1, 5, 12] };
      const errors = ProfileValidator.validate(profile);
      should(errors.some((e) => e.includes('authorIds'))).be.false();
    });

    it('should return an error when authorIds is an empty array', () => {
      const profile = { ...validBase(), authorIds: [] };
      const errors = ProfileValidator.validate(profile);
      should(errors.some((e) => e.includes('authorIds'))).be.true();
    });

    it('should return an error when authorIds contains non-positive integers', () => {
      const profile = { ...validBase(), authorIds: [1, -3, 'abc'] };
      const errors = ProfileValidator.validate(profile);
      should(errors.some((e) => e.includes('authorIds[1]'))).be.true();
      should(errors.some((e) => e.includes('authorIds[2]'))).be.true();
    });

    it('should return an error when authorIds is not an array', () => {
      const profile = { ...validBase(), authorIds: 'not-an-array' };
      const errors = ProfileValidator.validate(profile);
      should(
        errors.some((e) => e.includes('authorIds must be an array'))
      ).be.true();
    });
  });

  describe('required field: licenseId', () => {
    it('should return an error when licenseId is missing', () => {
      const profile = validBase();
      delete profile.licenseId;
      const errors = ProfileValidator.validate(profile);
      should(errors.some((e) => e.includes('licenseId'))).be.true();
    });
  });

  // -------------------------------------------------------------------------
  // IANA timezone validation
  // -------------------------------------------------------------------------
  describe('timezone validation', () => {
    it('should return an error for an invalid timezone "GMT+2"', () => {
      const profile = { ...validBase(), timezone: 'GMT+2' };
      const errors = ProfileValidator.validate(profile);
      should(
        errors.some(
          (e) =>
            e.toLowerCase().includes('timezone') ||
            e.toLowerCase().includes('iana')
        )
      ).be.true(`Expected timezone error, got: ${JSON.stringify(errors)}`);
    });

    it('should return an error for a fixed-offset timezone "+02:00"', () => {
      const profile = { ...validBase(), timezone: '+02:00' };
      const errors = ProfileValidator.validate(profile);
      should(
        errors.some(
          (e) =>
            e.toLowerCase().includes('timezone') ||
            e.toLowerCase().includes('iana')
        )
      ).be.true();
    });

    it('should return an error for the string "invalid"', () => {
      const profile = { ...validBase(), timezone: 'invalid' };
      const errors = ProfileValidator.validate(profile);
      should(
        errors.some(
          (e) =>
            e.toLowerCase().includes('timezone') ||
            e.toLowerCase().includes('iana')
        )
      ).be.true();
    });

    it('should accept a valid IANA timezone "Europe/Paris"', () => {
      const profile = { ...validBase(), timezone: 'Europe/Paris' };
      const errors = ProfileValidator.validate(profile);
      should(errors.some((e) => e.toLowerCase().includes('timezone'))).be.false(
        `"Europe/Paris" should be accepted, but got: ${JSON.stringify(errors)}`
      );
    });

    it('should accept a valid IANA timezone "America/New_York"', () => {
      const profile = { ...validBase(), timezone: 'America/New_York' };
      const errors = ProfileValidator.validate(profile);
      should(
        errors.some((e) => e.toLowerCase().includes('timezone'))
      ).be.false();
    });
  });

  // -------------------------------------------------------------------------
  // columnMappings structural validation
  // -------------------------------------------------------------------------
  describe('columnMappings: roles', () => {
    it('should return an error when there is no timestamp column', () => {
      const profile = {
        ...validBase(),
        columnMappings: [
          { columnIndex: 0, role: 'measurement', sensorConfigurationId: 5 },
          { columnIndex: 1, role: 'measurement', sensorConfigurationId: 6 },
        ],
      };
      const errors = ProfileValidator.validate(profile);
      should(errors.some((e) => e.toLowerCase().includes('timestamp'))).be.true(
        `Expected error about missing 'timestamp' role, got: ${JSON.stringify(errors)}`
      );
    });

    it('should return an error when there is no measurement column', () => {
      const profile = {
        ...validBase(),
        columnMappings: [
          { columnIndex: 0, role: 'timestamp', timestampType: 'datetime' },
          { columnIndex: 1, role: 'excluded' },
        ],
      };
      const errors = ProfileValidator.validate(profile);
      should(
        errors.some((e) => e.toLowerCase().includes('measurement'))
      ).be.true(
        `Expected error about missing 'measurement' role, got: ${JSON.stringify(errors)}`
      );
    });
  });

  describe('columnMappings: sensorConfigurationId on measurement columns', () => {
    it('should return an error when a measurement column is missing sensorConfigurationId', () => {
      const profile = {
        ...validBase(),
        columnMappings: [
          { columnIndex: 0, role: 'timestamp', timestampType: 'datetime' },
          {
            columnIndex: 1,
            role: 'measurement' /* no sensorConfigurationId */,
          },
        ],
      };
      const errors = ProfileValidator.validate(profile);
      should(errors.some((e) => e.includes('sensorConfigurationId'))).be.true(
        `Expected error about sensorConfigurationId, got: ${JSON.stringify(errors)}`
      );
    });

    it('should not return a sensorConfigurationId error for non-measurement columns', () => {
      const profile = {
        ...validBase(),
        columnMappings: [
          { columnIndex: 0, role: 'timestamp', timestampType: 'datetime' },
          {
            columnIndex: 1,
            role: 'excluded' /* no sensorConfigurationId — fine */,
          },
          { columnIndex: 2, role: 'measurement', sensorConfigurationId: 5 },
        ],
      };
      const errors = ProfileValidator.validate(profile);
      should(
        errors.some((e) => e.includes('sensorConfigurationId'))
      ).be.false();
    });
  });

  // -------------------------------------------------------------------------
  // caveId / pointLabel presence
  // -------------------------------------------------------------------------
  describe('caveId or pointLabel requirement', () => {
    it('should return an error when neither caveId nor pointLabel is provided', () => {
      const profile = validBase();
      delete profile.caveId;
      const errors = ProfileValidator.validate(profile);
      should(
        errors.some(
          (e) =>
            e.toLowerCase().includes('caveid') ||
            e.toLowerCase().includes('pointlabel') ||
            e.toLowerCase().includes('either')
        )
      ).be.true(
        `Expected error about caveId/pointLabel, got: ${JSON.stringify(errors)}`
      );
    });

    it('should not return that error when only caveId is provided', () => {
      const profile = { ...validBase(), caveId: 42 };
      delete profile.pointLabel;
      const errors = ProfileValidator.validate(profile);
      const cavePointError = errors.some(
        (e) =>
          (e.toLowerCase().includes('caveid') &&
            e.toLowerCase().includes('pointlabel')) ||
          e.toLowerCase().includes('either')
      );
      should(cavePointError).be.false();
    });

    it('should not return that error when only pointLabel is provided', () => {
      const profile = validBase();
      delete profile.caveId;
      profile.pointLabel = 'Station A';
      const errors = ProfileValidator.validate(profile);
      const cavePointError = errors.some(
        (e) =>
          (e.toLowerCase().includes('caveid') &&
            e.toLowerCase().includes('pointlabel')) ||
          e.toLowerCase().includes('either')
      );
      should(cavePointError).be.false();
    });
  });

  // -------------------------------------------------------------------------
  // numberLocale validation
  // -------------------------------------------------------------------------
  describe('numberLocale validation', () => {
    it('should return an error for an invalid numberLocale "de"', () => {
      const profile = { ...validBase(), numberLocale: 'de' };
      const errors = ProfileValidator.validate(profile);
      should(errors.some((e) => e.includes('numberLocale'))).be.true(
        `Expected numberLocale error, got: ${JSON.stringify(errors)}`
      );
    });

    it('should return an error for an invalid numberLocale "es"', () => {
      const profile = { ...validBase(), numberLocale: 'es' };
      const errors = ProfileValidator.validate(profile);
      should(errors.some((e) => e.includes('numberLocale'))).be.true();
    });

    it('should accept numberLocale "en"', () => {
      const profile = { ...validBase(), numberLocale: 'en' };
      const errors = ProfileValidator.validate(profile);
      should(errors.some((e) => e.includes('numberLocale'))).be.false(
        `"en" should be valid, got: ${JSON.stringify(errors)}`
      );
    });

    it('should accept numberLocale "fr"', () => {
      const profile = { ...validBase(), numberLocale: 'fr' };
      const errors = ProfileValidator.validate(profile);
      should(errors.some((e) => e.includes('numberLocale'))).be.false();
    });

    it('should not return an error when numberLocale is omitted', () => {
      const profile = validBase();
      delete profile.numberLocale;
      const errors = ProfileValidator.validate(profile);
      should(errors.some((e) => e.includes('numberLocale'))).be.false();
    });
  });

  // -------------------------------------------------------------------------
  // dataQuality validation
  // -------------------------------------------------------------------------
  describe('dataQuality validation', () => {
    it('should return an error for an invalid dataQuality "good"', () => {
      const profile = { ...validBase(), dataQuality: 'good' };
      const errors = ProfileValidator.validate(profile);
      should(errors.some((e) => e.includes('dataQuality'))).be.true(
        `Expected dataQuality error, got: ${JSON.stringify(errors)}`
      );
    });

    it('should return an error for an invalid dataQuality "excellent"', () => {
      const profile = { ...validBase(), dataQuality: 'excellent' };
      const errors = ProfileValidator.validate(profile);
      should(errors.some((e) => e.includes('dataQuality'))).be.true();
    });

    it('should accept dataQuality "raw"', () => {
      const profile = { ...validBase(), dataQuality: 'raw' };
      const errors = ProfileValidator.validate(profile);
      should(errors.some((e) => e.includes('dataQuality'))).be.false();
    });

    it('should accept dataQuality "validated"', () => {
      const profile = { ...validBase(), dataQuality: 'validated' };
      const errors = ProfileValidator.validate(profile);
      should(errors.some((e) => e.includes('dataQuality'))).be.false();
    });

    it('should accept dataQuality "suspect"', () => {
      const profile = { ...validBase(), dataQuality: 'suspect' };
      const errors = ProfileValidator.validate(profile);
      should(errors.some((e) => e.includes('dataQuality'))).be.false();
    });

    it('should accept dataQuality "rejected"', () => {
      const profile = { ...validBase(), dataQuality: 'rejected' };
      const errors = ProfileValidator.validate(profile);
      should(errors.some((e) => e.includes('dataQuality'))).be.false();
    });

    it('should not return an error when dataQuality is omitted', () => {
      const profile = validBase();
      delete profile.dataQuality;
      const errors = ProfileValidator.validate(profile);
      should(errors.some((e) => e.includes('dataQuality'))).be.false();
    });
  });

  // -------------------------------------------------------------------------
  // Timestamp column pairing (dateOnly / timeOnly)
  // -------------------------------------------------------------------------
  describe('timestamp column pairing', () => {
    it('should return an error for dateOnly without timeOnly', () => {
      const profile = {
        ...validBase(),
        columnMappings: [
          { columnIndex: 0, role: 'timestamp', timestampType: 'dateOnly' },
          { columnIndex: 1, role: 'measurement', sensorConfigurationId: 5 },
        ],
      };
      const errors = ProfileValidator.validate(profile);
      should(
        errors.some(
          (e) =>
            e.toLowerCase().includes('dateonly') ||
            e.toLowerCase().includes('timeonly')
        )
      ).be.true(
        `Expected dateOnly/timeOnly pairing error, got: ${JSON.stringify(errors)}`
      );
    });

    it('should return an error for timeOnly without dateOnly', () => {
      const profile = {
        ...validBase(),
        columnMappings: [
          { columnIndex: 0, role: 'timestamp', timestampType: 'timeOnly' },
          { columnIndex: 1, role: 'measurement', sensorConfigurationId: 5 },
        ],
      };
      const errors = ProfileValidator.validate(profile);
      should(
        errors.some(
          (e) =>
            e.toLowerCase().includes('dateonly') ||
            e.toLowerCase().includes('timeonly')
        )
      ).be.true();
    });

    it('should not return a pairing error when both dateOnly and timeOnly are present', () => {
      const profile = {
        ...validBase(),
        columnMappings: [
          { columnIndex: 0, role: 'timestamp', timestampType: 'dateOnly' },
          { columnIndex: 1, role: 'timestamp', timestampType: 'timeOnly' },
          { columnIndex: 2, role: 'measurement', sensorConfigurationId: 5 },
        ],
        dateOnlyFormat: 'YYYY-MM-DD',
        timeOnlyFormat: 'HH:mm:ss',
      };
      const errors = ProfileValidator.validate(profile);
      // Should have no timestamp-pairing-related errors
      const pairingErrors = errors.filter(
        (e) =>
          (e.toLowerCase().includes('dateonly') &&
            e.toLowerCase().includes('timeonly')) ||
          e.toLowerCase().includes('requires a matching')
      );
      should(pairingErrors).have.length(0);
    });
  });

  // -------------------------------------------------------------------------
  // Valid complete profile
  // -------------------------------------------------------------------------
  describe('valid profile', () => {
    it('should return no errors for a fully valid profile', () => {
      const profile = validBase();
      const errors = ProfileValidator.validate(profile);
      should(errors).be.an.Array();
      should(errors).have.length(0);
    });

    it('should return no errors for a valid profile using pointLabel instead of caveId', () => {
      const profile = validBase();
      delete profile.caveId;
      profile.pointLabel = 'Station A';
      const errors = ProfileValidator.validate(profile);
      should(errors).have.length(0);
    });
  });

  // -------------------------------------------------------------------------
  // Error accumulation: multiple errors returned together
  // -------------------------------------------------------------------------
  describe('error accumulation', () => {
    it('should return all errors at once when multiple validation rules fail', () => {
      const profile = {
        // Missing: timezone, authorIds, licenseId, columnMappings
        // Also: no caveId/pointLabel
      };
      const errors = ProfileValidator.validate(profile);
      // Should have at least 4 errors (timezone, authorIds, licenseId, columnMappings, caveId/pointLabel)
      should(errors.length).be.aboveOrEqual(4);
    });

    it('should accumulate errors for invalid timezone AND invalid numberLocale simultaneously', () => {
      const profile = {
        ...validBase(),
        timezone: '+02:00',
        numberLocale: 'de',
      };
      const errors = ProfileValidator.validate(profile);
      const timezoneError = errors.some(
        (e) =>
          e.toLowerCase().includes('timezone') ||
          e.toLowerCase().includes('iana')
      );
      const localeError = errors.some((e) => e.includes('numberLocale'));
      should(timezoneError).be.true('Expected timezone error');
      should(localeError).be.true('Expected numberLocale error');
    });

    it('should accumulate errors for multiple missing required fields', () => {
      const profile = {
        timezone: 'Europe/Paris',
        // missing authorIds, licenseId, columnMappings
        caveId: 1,
      };
      const errors = ProfileValidator.validate(profile);
      should(errors.some((e) => e.includes('authorIds'))).be.true();
      should(errors.some((e) => e.includes('licenseId'))).be.true();
      should(errors.some((e) => e.includes('columnMappings'))).be.true();
    });

    it('should accumulate per-column sensorConfigurationId errors for multiple measurement columns', () => {
      const profile = {
        ...validBase(),
        columnMappings: [
          { columnIndex: 0, role: 'timestamp', timestampType: 'datetime' },
          {
            columnIndex: 1,
            role: 'measurement' /* missing sensorConfigurationId */,
          },
          {
            columnIndex: 2,
            role: 'measurement' /* missing sensorConfigurationId */,
          },
        ],
      };
      const errors = ProfileValidator.validate(profile);
      const sensorErrors = errors.filter((e) =>
        e.includes('sensorConfigurationId')
      );
      // One error per measurement column missing sensorConfigurationId
      should(sensorErrors.length).equal(2);
    });
  });
});
