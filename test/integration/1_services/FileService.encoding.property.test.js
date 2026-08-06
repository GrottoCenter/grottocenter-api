/* eslint-disable func-names */
const should = require('should');
const fc = require('fast-check');
const FileService = require('../../../api/services/FileService');

/**
 * Bug Condition Exploration — Non-ASCII Filename Mojibake
 *
 * Demonstrates that multer's default `defParamCharset: 'latin1'` causes
 * UTF-8 filenames to be misinterpreted as Latin-1, producing mojibake.
 *
 * The bug lives in the multer middleware layer (config/http.js), not in
 * FileService itself. FileService is a passthrough — it stores whatever
 * `file.originalname` it receives. When multer decodes UTF-8 bytes as
 * Latin-1, the garbled string flows through FileService into the database.
 *
 * These tests use concrete counterexamples to surface the encoding problem.
 *
 * Validates: Requirements 1.1, 1.2, 2.1, 2.2
 */
describe('FileService — Property 1: Bug Condition — Non-ASCII Filename Mojibake', () => {
  // -------------------------------------------------------------------------
  // Test 1: Pure encoding demonstration (no DB)
  // Shows that UTF-8 bytes decoded as Latin-1 produce mojibake.
  // -------------------------------------------------------------------------
  describe('UTF-8 bytes decoded as Latin-1 produce mojibake', () => {
    const cases = [
      { original: 'Entrée.pdf', expectedMojibake: 'EntrÃ©e.pdf' },
      { original: 'Höhle.pdf', expectedMojibake: 'HÃ¶hle.pdf' },
      { original: 'über.pdf', expectedMojibake: 'Ã¼ber.pdf' },
      { original: 'café.pdf', expectedMojibake: 'cafÃ©.pdf' },
    ];

    cases.forEach(({ original, expectedMojibake }) => {
      it(`should garble "${original}" into "${expectedMojibake}" when decoded as Latin-1`, () => {
        // Simulate what multer does: take UTF-8 string, get its bytes,
        // then decode those bytes as Latin-1
        const utf8Bytes = Buffer.from(original, 'utf8');
        const mojibake = utf8Bytes.toString('latin1');

        // The mojibake should NOT equal the original
        should(mojibake).not.equal(
          original,
          `Latin-1 decoding of UTF-8 bytes should produce mojibake, but got the original back`
        );

        // The mojibake should match the expected garbled string
        should(mojibake).equal(
          expectedMojibake,
          `Expected mojibake "${expectedMojibake}" but got "${mojibake}"`
        );

        // The mojibake string is longer because multi-byte UTF-8 chars
        // expand to multiple Latin-1 characters
        should(mojibake.length).be.above(
          original.length,
          'Mojibake string should be longer than the original'
        );
      });
    });
  });

  // -------------------------------------------------------------------------
  // Test 2: FileService stores whatever originalname it receives
  // Shows that the service is a passthrough — no encoding correction.
  // -------------------------------------------------------------------------
  describe('FileService stores whatever originalname it receives (passthrough)', () => {
    // idDocument=1 exists in test/fixtures/tdocument.json (fixture: "Spelunca [COLLECTION]")
    const idDocument = 1;

    it('should store a mojibake filename as-is when multer provides it', async () => {
      // Simulate multer's Latin-1 decoding of a UTF-8 filename
      const originalUtf8 = 'Entrée.pdf';
      const mojibake = Buffer.from(originalUtf8, 'utf8').toString('latin1');

      const file = {
        originalname: mojibake, // multer would provide this garbled name
        buffer: Buffer.from('test'),
        size: 100,
      };

      let createdFile;
      try {
        createdFile = await FileService.document.create(file, idDocument, true);

        // FileService stores the mojibake without correction
        should(createdFile.fileName).equal(
          mojibake,
          'FileService should store the mojibake filename as-is'
        );

        // The stored filename is NOT the correct Unicode original
        should(createdFile.fileName).not.equal(
          originalUtf8,
          'Stored filename should not match the original UTF-8 name (bug present)'
        );
      } finally {
        if (createdFile) {
          await TFile.destroyOne(createdFile.id);
        }
      }
    });

    it('should store a correct UTF-8 filename as-is when provided directly', async () => {
      const originalUtf8 = 'Entrée.pdf';

      const file = {
        originalname: originalUtf8, // correct UTF-8 name (as if multer decoded properly)
        buffer: Buffer.from('test'),
        size: 100,
      };

      let createdFile;
      try {
        createdFile = await FileService.document.create(file, idDocument, true);

        // FileService stores the correct name when given the correct name
        should(createdFile.fileName).equal(
          originalUtf8,
          'FileService should store the correct UTF-8 filename when provided'
        );
      } finally {
        if (createdFile) {
          await TFile.destroyOne(createdFile.id);
        }
      }
    });
  });

  // -------------------------------------------------------------------------
  // Test 3: Mojibake filename in DB does NOT equal the original Unicode name
  // This is the core bug demonstration — the round-trip is broken.
  // -------------------------------------------------------------------------
  describe('mojibake filename stored in DB does not equal original Unicode', () => {
    // idDocument=1 exists in test/fixtures/tdocument.json (fixture: "Spelunca [COLLECTION]")
    const idDocument = 1;

    const nonAsciiFilenames = [
      'Entrée.pdf',
      'Höhle.pdf',
      'über.pdf',
      'café.pdf',
      'señor.pdf',
    ];

    nonAsciiFilenames.forEach((originalUtf8) => {
      it(`should demonstrate broken round-trip for "${originalUtf8}"`, async () => {
        // Simulate multer's Latin-1 decoding
        const mojibake = Buffer.from(originalUtf8, 'utf8').toString('latin1');

        const file = {
          originalname: mojibake,
          buffer: Buffer.from('test'),
          size: 100,
        };

        let createdFile;
        try {
          createdFile = await FileService.document.create(
            file,
            idDocument,
            true
          );

          // The stored filename is the mojibake, not the original
          should(createdFile.fileName).equal(mojibake);
          should(createdFile.fileName).not.equal(
            originalUtf8,
            `Round-trip broken: stored "${createdFile.fileName}" instead of "${originalUtf8}"`
          );

          // Verify by reading back from DB
          const dbRecord = await TFile.findOne(createdFile.id);
          should(dbRecord.fileName).not.equal(
            originalUtf8,
            `DB record contains mojibake "${dbRecord.fileName}" instead of "${originalUtf8}"`
          );
        } finally {
          if (createdFile) {
            await TFile.destroyOne(createdFile.id);
          }
        }
      });
    });
  });
});

/**
 * Property 2: Preservation — ASCII-Only Filename and Record Field Integrity
 *
 * Verifies that ASCII-only filenames are stored correctly and that all
 * non-filename fields (path, isValidated, fileFormat, URL) behave as expected.
 * These tests MUST PASS on unfixed code — passing confirms baseline behavior
 * that the encoding fix must preserve.
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4
 */
describe('FileService — Property 2: Preservation — ASCII-Only Filename and Record Field Integrity', () => {
  // Arbitrary: ASCII-only filenames without dots or empty strings
  const asciiFilename = fc.stringMatching(/^[a-zA-Z0-9_-]{1,50}$/);

  // idDocument=1 exists in test/fixtures/tdocument.json (fixture: "Spelunca [COLLECTION]")
  const idDocument = 1;

  it('should store ASCII-only filenames exactly as provided', function () {
    this.timeout(30000);
    return fc.assert(
      fc.asyncProperty(asciiFilename, async (name) => {
        const fullName = `${name}.pdf`;
        const file = {
          originalname: fullName,
          buffer: Buffer.from('test'),
          size: 100,
        };
        let createdFile;
        try {
          createdFile = await FileService.document.create(
            file,
            idDocument,
            true
          );
          should(createdFile.fileName).equal(
            fullName,
            `fileName should be stored exactly as "${fullName}"`
          );
        } finally {
          if (createdFile) {
            await TFile.destroyOne(createdFile.id);
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should generate path matching {digits}-{filename_underscored}', function () {
    this.timeout(30000);
    return fc.assert(
      fc.asyncProperty(asciiFilename, async (name) => {
        const fullName = `${name}.pdf`;
        const file = {
          originalname: fullName,
          buffer: Buffer.from('test'),
          size: 100,
        };
        let createdFile;
        try {
          createdFile = await FileService.document.create(
            file,
            idDocument,
            true
          );
          const expectedUnderscored = fullName.replace(/ /g, '_');
          const escapedFilename = expectedUnderscored.replace(
            /[.*+?^${}()|[\]\\]/g,
            '\\$&'
          );
          const pathPattern = new RegExp(`^\\d+-${escapedFilename}$`);
          should(createdFile.path).match(
            pathPattern,
            `path "${createdFile.path}" should match pattern {digits}-{filename_underscored}`
          );
        } finally {
          if (createdFile) {
            await TFile.destroyOne(createdFile.id);
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should default isValidated to true', function () {
    this.timeout(10000);
    return fc.assert(
      fc.asyncProperty(asciiFilename, async (name) => {
        const fullName = `${name}.pdf`;
        const file = {
          originalname: fullName,
          buffer: Buffer.from('test'),
          size: 100,
        };
        let createdFile;
        try {
          createdFile = await FileService.document.create(
            file,
            idDocument,
            true
          );
          should(createdFile.isValidated).equal(
            true,
            'isValidated should default to true'
          );
        } finally {
          if (createdFile) {
            await TFile.destroyOne(createdFile.id);
          }
        }
      }),
      { numRuns: 20 }
    );
  });

  it('should set fileFormat to a number', function () {
    this.timeout(10000);
    return fc.assert(
      fc.asyncProperty(asciiFilename, async (name) => {
        const fullName = `${name}.pdf`;
        const file = {
          originalname: fullName,
          buffer: Buffer.from('test'),
          size: 100,
        };
        let createdFile;
        try {
          createdFile = await FileService.document.create(
            file,
            idDocument,
            true
          );
          should(createdFile.fileFormat).be.a.Number();
        } finally {
          if (createdFile) {
            await TFile.destroyOne(createdFile.id);
          }
        }
      }),
      { numRuns: 20 }
    );
  });

  it('should produce a getUrl containing the Azure documents base URL', function () {
    this.timeout(10000);
    return fc.assert(
      fc.asyncProperty(asciiFilename, async (name) => {
        const fullName = `${name}.pdf`;
        const file = {
          originalname: fullName,
          buffer: Buffer.from('test'),
          size: 100,
        };
        let createdFile;
        try {
          createdFile = await FileService.document.create(
            file,
            idDocument,
            true
          );
          const url = FileService.document.getUrl(createdFile.path);
          should(url).containEql('local-uploads/documents/');
        } finally {
          if (createdFile) {
            await TFile.destroyOne(createdFile.id);
          }
        }
      }),
      { numRuns: 20 }
    );
  });
});
