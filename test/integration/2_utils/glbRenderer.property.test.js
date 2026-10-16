const should = require('should');
const fc = require('fast-check');
const { WIDTH, HEIGHT, renderGlb } = require('../../../api/utils/glbRenderer');
const { cubeGlb, readPixels } = require('../../helpers/glbModels');

const unitQuaternion = fc
  .tuple(
    fc.double({ min: -1, max: 1, noNaN: true }),
    fc.double({ min: -1, max: 1, noNaN: true }),
    fc.double({ min: -1, max: 1, noNaN: true }),
    fc.double({ min: -1, max: 1, noNaN: true })
  )
  .filter((q) => Math.hypot(...q) > 0.1)
  .map((q) => q.map((v) => v / Math.hypot(...q)));

const coordinate = fc.double({ min: -10000, max: 10000, noNaN: true });
// Scans are in meters, sample models in centimeters or kilometers
const scale = fc.double({ min: 0.001, max: 1000, noNaN: true });
// Proportions up to 1:100 (a shaft, a gallery); thinner slivers fall below a
// pixel and their tips are legitimately not rasterized
const proportion = fc.double({ min: 0.1, max: 10, noNaN: true });

describe('glbRenderer - Property: the model is always framed', () => {
  // Whatever the node placement, orientation, size and proportions, the camera
  // fit leaves the model inside the frame margins, filling 90% of the limiting
  // axis and centered on it. A renderer that ignored the node matrix, framed
  // the local bounds or skipped the fit would leave the model off-frame or
  // tiny for most of these inputs.
  it('fits any transformed cube to 90% of the frame', async function fitsTransformedCube() {
    this.timeout(120000);
    await fc.assert(
      fc.asyncProperty(
        fc.tuple(coordinate, coordinate, coordinate),
        unitQuaternion,
        scale,
        fc.tuple(proportion, proportion, proportion),
        async (translation, rotation, size, proportions) => {
          const scales = proportions.map((p) => p * size);
          const pixels = await readPixels(
            await renderGlb(
              await cubeGlb({ node: { translation, rotation, scale: scales } })
            )
          );
          const box = pixels.opaqueBox();
          should(box.maxX).be.aboveOrEqual(box.minX);
          should(box.minX).be.above(0);
          should(box.minY).be.above(0);
          should(box.maxX).be.below(WIDTH - 1);
          should(box.maxY).be.below(HEIGHT - 1);
          const fillX = (box.maxX - box.minX + 1) / WIDTH;
          const fillY = (box.maxY - box.minY + 1) / HEIGHT;
          should(Math.max(fillX, fillY)).be.approximately(0.9, 0.01);
          // Centered: equal margins on both sides of each axis, to a pixel
          should(box.minX + box.maxX).be.approximately(WIDTH - 1, 3);
          should(box.minY + box.maxY).be.approximately(HEIGHT - 1, 3);
        }
      ),
      { numRuns: 30 }
    );
  });
});
