const should = require('should');
const {
  WIDTH,
  HEIGHT,
  GlbRenderError,
  renderGlb,
  renderGlbInWorker,
} = require('../../../api/utils/glbRenderer');
const {
  cubeGlb,
  emptySceneGlb,
  readPixels,
  solidPng,
} = require('../../helpers/glbModels');

const center = (pixels) =>
  pixels.at(Math.floor(pixels.width / 2), Math.floor(pixels.height / 2));

describe('glbRenderer', () => {
  describe('renderGlb()', () => {
    it('renders a PNG of the expected size with a transparent background', async () => {
      const pixels = await readPixels(await renderGlb(await cubeGlb()));
      should(pixels.width).equal(WIDTH);
      should(pixels.height).equal(HEIGHT);
      should(center(pixels).a).equal(255);
      should(pixels.at(0, 0).a).equal(0);
      should(pixels.at(WIDTH - 1, HEIGHT - 1).a).equal(0);
    });

    it('fits the model in the frame, within the margin', async () => {
      const pixels = await readPixels(await renderGlb(await cubeGlb()));
      const box = pixels.opaqueBox();
      should(box.minX).be.above(0);
      should(box.minY).be.above(0);
      should(box.maxX).be.below(WIDTH - 1);
      should(box.maxY).be.below(HEIGHT - 1);
      // The limiting axis spans 90% of the frame
      const fill = Math.max(
        (box.maxX - box.minX + 1) / WIDTH,
        (box.maxY - box.minY + 1) / HEIGHT
      );
      should(fill).be.approximately(0.9, 0.01);
    });

    it('uses the material base color factor', async () => {
      const pixels = await readPixels(
        await renderGlb(await cubeGlb({ baseColor: [1, 0, 0, 1] }))
      );
      const { r, g, b } = center(pixels);
      should(r).be.above(100);
      should(g).equal(0);
      should(b).equal(0);
    });

    it('multiplies by the vertex colors', async () => {
      const pixels = await readPixels(
        await renderGlb(await cubeGlb({ vertexColor: [0, 1, 0] }))
      );
      const { r, g, b } = center(pixels);
      should(g).be.above(100);
      should(r).equal(0);
      should(b).equal(0);
    });

    it('samples the embedded base color texture', async () => {
      const texturePng = await solidPng({ r: 0, g: 0, b: 255 });
      const pixels = await readPixels(
        await renderGlb(await cubeGlb({ texturePng }))
      );
      const { r, g, b } = center(pixels);
      should(b).be.above(100);
      should(r).equal(0);
      should(g).equal(0);
    });

    it('multiplies the alpha mask by the vertex alpha', async () => {
      // Hidden by its vertex alpha: nothing is drawn
      await should(
        renderGlb(
          await cubeGlb({ vertexColor: [1, 1, 1, 0], alphaMode: 'MASK' })
        )
      ).be.rejectedWith(GlbRenderError, { message: /covers no pixel/ });

      const pixels = await readPixels(
        await renderGlb(
          await cubeGlb({ vertexColor: [1, 0, 0, 1], alphaMode: 'MASK' })
        )
      );
      should(center(pixels).a).equal(255);
      should(center(pixels).r).be.above(100);
    });

    it('ignores the vertex alpha of an opaque material', async () => {
      const pixels = await readPixels(
        await renderGlb(await cubeGlb({ vertexColor: [0, 1, 0, 0] }))
      );
      should(center(pixels).a).equal(255);
      should(center(pixels).g).be.above(100);
    });

    it('decodes a Draco compressed mesh', async () => {
      const glb = await cubeGlb({ draco: true, baseColor: [1, 0, 0, 1] });
      should(Buffer.from(glb).includes('KHR_draco_mesh_compression')).be.true();
      const pixels = await readPixels(await renderGlb(glb));
      should(center(pixels).a).equal(255);
      should(center(pixels).r).be.above(100);
    });

    it('rejects a scene without any mesh', async () => {
      await should(renderGlb(await emptySceneGlb())).be.rejectedWith(
        GlbRenderError
      );
    });

    it('rejects a model with no extent', async () => {
      await should(
        renderGlb(await cubeGlb({ collapsed: true }))
      ).be.rejectedWith(GlbRenderError, { message: /no visible extent/ });
    });

    it('keeps the detail of a georeferenced model far from the origin', async () => {
      // A 2 cm cube placed at UTM-like coordinates: single precision would
      // collapse it to a point
      const pixels = await readPixels(
        await renderGlb(
          await cubeGlb({
            node: {
              translation: [500000, 1000, 5000000],
              scale: [0.01, 0.01, 0.01],
            },
          })
        )
      );
      should(center(pixels).a).equal(255);
      const box = pixels.opaqueBox();
      should((box.maxY - box.minY + 1) / HEIGHT).be.approximately(0.9, 0.01);
    });

    it('rejects a model whose triangles cover no pixel', async () => {
      // Flattened to a segment: an extent, but only zero-area triangles
      await should(
        renderGlb(await cubeGlb({ node: { scale: [1, 0, 0] } }))
      ).be.rejectedWith(GlbRenderError, { message: /covers no pixel/ });
    });

    it('rejects a file that is not a GLB', async () => {
      await should(renderGlb(Buffer.from('not a model'))).be.rejected();
    });
  });

  describe('renderGlbInWorker()', () => {
    it('renders the model in a worker thread', async () => {
      const pixels = await readPixels(
        await renderGlbInWorker(await cubeGlb({ baseColor: [1, 0, 0, 1] }))
      );
      should(pixels.width).equal(WIDTH);
      should(center(pixels).r).be.above(100);
    });

    it('relays rendering errors from the worker', async () => {
      await should(renderGlbInWorker(await emptySceneGlb())).be.rejectedWith(
        GlbRenderError,
        { message: /no triangle/ }
      );
    });

    it('relays a GLB parsing error as a plain error', async () => {
      const err = await renderGlbInWorker(Buffer.from('not a model')).then(
        () => null,
        (e) => e
      );
      should(err).be.an.Error();
      should(err).not.be.an.instanceOf(GlbRenderError);
    });

    it('stops the worker past the timeout', async () => {
      await should(
        renderGlbInWorker(await cubeGlb(), { timeoutMs: 1 })
      ).be.rejectedWith(GlbRenderError, { message: /timed out/ });
    });
  });
});
