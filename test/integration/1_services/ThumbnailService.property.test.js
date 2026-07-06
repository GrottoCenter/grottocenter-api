const should = require('should');
const fc = require('fast-check');
const ThumbnailService = require('../../../api/services/ThumbnailService');
const FileService = require('../../../api/services/FileService');
const { toFile } = require('../../../api/services/mapping/converters');

// --- Arbitraries ---

// Image widths: positive integers covering the full range of realistic images
const imageWidthArb = fc.integer({ min: 1, max: 10000 });

// Original paths with at least one dot and a valid extension
const originalPathArb = fc.stringMatching(/^[a-z0-9-]{1,50}\.[a-z]{2,4}$/);

// Paths with multiple dots (adversarial)
const multiDotPathArb = fc.stringMatching(
  /^[a-z0-9-]{1,20}\.[a-z0-9-]{1,20}\.[a-z]{2,4}$/
);

// Variant names
const variantArb = fc.constantFrom('small', 'medium', 'large');

// Thumbnail source fields: each can be a non-empty string or null
const thumbnailFieldArb = fc.oneof(
  fc.constant(null),
  fc.constant(undefined),
  fc.stringMatching(/^thumbnails\/(small|medium|large)\/[a-z0-9-]+\.webp$/)
);

/**
 * Feature: image-thumbnail-generation
 * Property 1: No-upscaling variant selection
 *
 * For any positive integer originalWidth, getApplicableVariants(originalWidth)
 * returns only variants whose width is strictly less than originalWidth.
 * No variant with width >= originalWidth appears in the result.
 *
 * Constrains: the no-upscaling invariant that prevents blurry enlargements.
 * Design decision: strict less-than comparison (not <=).
 * Input partition: all positive integer widths from 1 to 10000.
 */
describe('ThumbnailService - Property 1: No-upscaling variant selection', () => {
  it('should return only variants narrower than the original width', () => {
    fc.assert(
      fc.property(imageWidthArb, (originalWidth) => {
        const result = ThumbnailService.getApplicableVariants(originalWidth);

        // All returned variants must have width strictly less than original
        result.forEach((variant) => {
          should(variant.width).be.below(
            originalWidth,
            `Variant ${variant.name} (${variant.width}px) should not be generated for original width ${originalWidth}px`
          );
        });

        // All defined variants with width >= originalWidth must NOT appear
        const skippedVariants = ThumbnailService.VARIANTS.filter(
          (v) => v.width >= originalWidth
        );
        const resultNames = result.map((v) => v.name);
        skippedVariants.forEach((v) => {
          should(resultNames).not.containEql(
            v.name,
            `Variant ${v.name} (${v.width}px) should be skipped for original width ${originalWidth}px`
          );
        });

        // Result is a subset of VARIANTS
        should(result.length).be.belowOrEqual(ThumbnailService.VARIANTS.length);
      }),
      { numRuns: 100 }
    );
  });

  it('should return all variants when original is wider than the largest variant', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1921, max: 10000 }), (originalWidth) => {
        const result = ThumbnailService.getApplicableVariants(originalWidth);
        should(result.length).equal(3);
      }),
      { numRuns: 100 }
    );
  });

  it('should return no variants when original width is 1', () => {
    const result = ThumbnailService.getApplicableVariants(1);
    should(result.length).equal(0);
  });
});

/**
 * Feature: image-thumbnail-generation
 * Property 2: Thumbnail path computation
 *
 * For any variant name and any original path with at least one dot,
 * computeThumbnailPath(variant, originalPath) returns a string matching
 * "thumbnails/<variant>/<stem>.webp" where stem is the path with its
 * final extension removed.
 *
 * Constrains: the naming convention for thumbnail blobs.
 * Design decision: extension replacement (last dot), always .webp output.
 * Input partition: simple paths and multi-dot paths.
 */
describe('ThumbnailService - Property 2: Thumbnail path computation', () => {
  it('should produce paths matching thumbnails/<variant>/<stem>.webp for simple paths', () => {
    fc.assert(
      fc.property(variantArb, originalPathArb, (variant, originalPath) => {
        const result = ThumbnailService.computeThumbnailPath(
          variant,
          originalPath
        );

        // Must start with thumbnails/<variant>/
        should(result.startsWith(`thumbnails/${variant}/`)).be.true(
          `Result "${result}" should start with "thumbnails/${variant}/"`
        );

        // Must end with .webp
        should(result.endsWith('.webp')).be.true(
          `Result "${result}" should end with ".webp"`
        );

        // Stem extraction: remove extension from original, prepend prefix
        const lastDot = originalPath.lastIndexOf('.');
        const stem = originalPath.slice(0, lastDot);
        const expected = `thumbnails/${variant}/${stem}.webp`;
        should(result).equal(expected);
      }),
      { numRuns: 100 }
    );
  });

  it('should handle paths with multiple dots (replaces only the last extension)', () => {
    fc.assert(
      fc.property(variantArb, multiDotPathArb, (variant, originalPath) => {
        const result = ThumbnailService.computeThumbnailPath(
          variant,
          originalPath
        );

        // Must end with .webp
        should(result.endsWith('.webp')).be.true();

        // The stem should preserve all dots except the last one
        const lastDot = originalPath.lastIndexOf('.');
        const stem = originalPath.slice(0, lastDot);
        should(result).equal(`thumbnails/${variant}/${stem}.webp`);
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: image-thumbnail-generation
 * Property 3: Converter thumbnail output construction
 *
 * For any TFile source with thumbnailSmall/Medium/Large fields (each
 * either a non-empty string or null/undefined):
 * - If ALL three are null/undefined, thumbnails field is null
 * - If ANY is a non-empty string, thumbnails is an object with exactly
 *   three keys (small, medium, large)
 * - Each key maps to the full URL or null based on the source field
 *
 * Constrains: the converter output shape for responsive image srcSet.
 * Design decision: all-null → null (not empty object).
 * Input partition: all combinations of present/absent thumbnail fields.
 */
describe('ThumbnailService - Property 3: Converter thumbnail output construction', () => {
  it('should return thumbnails: null when all thumbnail fields are null/undefined', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.integer({ min: 1, max: 99999 }),
          dateInscription: fc.constant(new Date().toISOString()),
          isValidated: fc.boolean(),
          fileName: fc.stringMatching(/^[a-z0-9-]+\.[a-z]{2,4}$/),
          path: fc.stringMatching(/^[a-z0-9-]+\.[a-z]{2,4}$/),
          thumbnailSmall: fc.constant(null),
          thumbnailMedium: fc.constant(null),
          thumbnailLarge: fc.constant(null),
        }),
        (source) => {
          const result = toFile(source);
          should(result.thumbnails).be.null();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return thumbnails object when at least one field is truthy', () => {
    // At least one thumbnail field must be a non-empty string
    const sourceArb = fc
      .record({
        id: fc.integer({ min: 1, max: 99999 }),
        dateInscription: fc.constant(new Date().toISOString()),
        isValidated: fc.boolean(),
        fileName: fc.stringMatching(/^[a-z0-9-]+\.[a-z]{2,4}$/),
        path: fc.stringMatching(/^[a-z0-9-]+\.[a-z]{2,4}$/),
        thumbnailSmall: thumbnailFieldArb,
        thumbnailMedium: thumbnailFieldArb,
        thumbnailLarge: thumbnailFieldArb,
      })
      .filter((s) => s.thumbnailSmall || s.thumbnailMedium || s.thumbnailLarge);

    fc.assert(
      fc.property(sourceArb, (source) => {
        const result = toFile(source);

        should(result.thumbnails).not.be.null();
        should(result.thumbnails).have.keys('small', 'medium', 'large');
        should(Object.keys(result.thumbnails).length).equal(3);

        // Each non-null source field produces a full URL
        if (source.thumbnailSmall) {
          should(result.thumbnails.small).equal(
            FileService.document.getUrl(source.thumbnailSmall)
          );
        } else {
          should(result.thumbnails.small).be.null();
        }
        if (source.thumbnailMedium) {
          should(result.thumbnails.medium).equal(
            FileService.document.getUrl(source.thumbnailMedium)
          );
        } else {
          should(result.thumbnails.medium).be.null();
        }
        if (source.thumbnailLarge) {
          should(result.thumbnails.large).equal(
            FileService.document.getUrl(source.thumbnailLarge)
          );
        } else {
          should(result.thumbnails.large).be.null();
        }
      }),
      { numRuns: 100 }
    );
  });
});
