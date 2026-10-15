/**
 * glbRenderer.js
 *
 * @description :: Renders a self-contained GLB model to a static PNG preview
 *   with a small software rasterizer, so that no browser, GPU or native module
 *   is needed on the server. The preview is meant for thumbnails: one fixed
 *   three-quarter view, the model fitted in the frame, a transparent
 *   background, flat Lambert shading and the base color of each material
 *   (factor × vertex color × embedded base color texture).
 *
 *   Draco and meshopt compressed models are decoded. Points and lines, skins,
 *   morph targets, instancing and texture transforms are ignored.
 */

const path = require('path');
const { Worker } = require('worker_threads');
const { NodeIO } = require('@gltf-transform/core');
const { ALL_EXTENSIONS } = require('@gltf-transform/extensions');
const draco3d = require('draco3dgltf');
const { MeshoptDecoder } = require('meshoptimizer');
const sharp = require('sharp');

const WIDTH = 2048;
const HEIGHT = 1536;
// Rendering time grows with the triangle count: refuse what a thumbnail job
// could not render in reasonable time (the upload limit is 100 MB).
const MAX_TRIANGLES = 20000000;
// Embedded textures are downsized before sampling to bound memory use
const MAX_TEXTURE_SIZE = 2048;
// Fraction of the frame left empty around the model
const MARGIN = 0.05;
const FOV_Y = (40 * Math.PI) / 180;
// Camera direction from the model center: front, right and above (glTF is Y up)
const AZIMUTH = (35 * Math.PI) / 180;
const ELEVATION = (25 * Math.PI) / 180;
const AMBIENT = 0.45;
const WORKER_TIMEOUT_MS = 2 * 60 * 1000;
// Pixel and texture buffers live outside the V8 heap; the heap only holds the
// parsed glTF document
const WORKER_MAX_HEAP_MB = 512;

const MODE_TRIANGLES = 4;
const MODE_TRIANGLE_STRIP = 5;
const MODE_TRIANGLE_FAN = 6;

class GlbRenderError extends Error {}

let ioPromise = null;
const getIO = () => {
  if (!ioPromise) {
    ioPromise = (async () => {
      await MeshoptDecoder.ready;
      return new NodeIO()
        .registerExtensions(ALL_EXTENSIONS)
        .registerDependencies({
          'draco3d.decoder': await draco3d.createDecoderModule(),
          'meshopt.decoder': MeshoptDecoder,
        });
    })();
  }
  return ioPromise;
};

const SRGB_TO_LINEAR = new Float32Array(256).map((_, i) => {
  const c = i / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
});

const linearToSrgb8 = (c) => {
  const v = c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055;
  return Math.max(0, Math.min(255, Math.round(v * 255)));
};

const triangleIndices = (mode, indices, count) => {
  const at = indices ? (i) => indices[i] : (i) => i;
  const n = indices ? indices.length : count;
  if (mode === MODE_TRIANGLES) {
    const out = new Uint32Array(n - (n % 3));
    for (let i = 0; i < out.length; i += 1) out[i] = at(i);
    return out;
  }
  if (mode === MODE_TRIANGLE_STRIP || mode === MODE_TRIANGLE_FAN) {
    const tris = Math.max(0, n - 2);
    const out = new Uint32Array(tris * 3);
    for (let i = 0; i < tris; i += 1) {
      if (mode === MODE_TRIANGLE_FAN) {
        out.set([at(0), at(i + 1), at(i + 2)], i * 3);
      } else if (i % 2 === 0) {
        out.set([at(i), at(i + 1), at(i + 2)], i * 3);
      } else {
        out.set([at(i + 1), at(i), at(i + 2)], i * 3);
      }
    }
    return out;
  }
  return new Uint32Array(0);
};

/**
 * Read a POSITION accessor into world space with the node matrix.
 * In double precision: georeferenced models put large offsets (e.g. UTM
 * coordinates) in the node translation, which single precision would
 * round to meters.
 * @returns {Float64Array} x, y, z per vertex
 */
const worldPositions = (accessor, m) => {
  const count = accessor.getCount();
  const out = new Float64Array(count * 3);
  const p = [];
  for (let i = 0; i < count; i += 1) {
    accessor.getElement(i, p);
    // glTF matrices are column-major
    out[i * 3] = m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12];
    out[i * 3 + 1] = m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13];
    out[i * 3 + 2] = m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14];
  }
  return out;
};

/**
 * Read the first `size` components of every element of an accessor; missing
 * components (the alpha of an RGB color) default to 1.
 * @returns {Float32Array}
 */
const readComponents = (accessor, size) => {
  const count = accessor.getCount();
  const available = Math.min(size, accessor.getElementSize());
  const out = new Float32Array(count * size).fill(1);
  const element = [];
  for (let i = 0; i < count; i += 1) {
    accessor.getElement(i, element);
    for (let k = 0; k < available; k += 1) out[i * size + k] = element[k];
  }
  return out;
};

const decodeTexture = async (texture, cache) => {
  if (!texture) return null;
  if (cache.has(texture)) return cache.get(texture);
  let decoded = null;
  try {
    const { data, info } = await sharp(Buffer.from(texture.getImage()))
      .resize({
        width: MAX_TEXTURE_SIZE,
        height: MAX_TEXTURE_SIZE,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    decoded = { data, width: info.width, height: info.height };
  } catch (err) {
    // Formats sharp cannot decode (e.g. KTX2): fall back to the color factor
    decoded = null;
  }
  cache.set(texture, decoded);
  return decoded;
};

/**
 * Collect every triangle primitive of the default scene, in world space.
 * @returns {Promise<Array<object>>}
 */
const collectPrimitives = async (document) => {
  const root = document.getRoot();
  const scene = root.getDefaultScene() || root.listScenes()[0];
  if (!scene) return [];

  const meshNodes = [];
  scene.traverse((node) => {
    if (node.getMesh()) meshNodes.push(node);
  });

  const textureCache = new Map();
  const primitives = [];
  let triangleCount = 0;

  for (const node of meshNodes) {
    const world = node.getWorldMatrix();
    for (const primitive of node.getMesh().listPrimitives()) {
      const position = primitive.getAttribute('POSITION');
      if (position) {
        const indices = primitive.getIndices();
        const tris = triangleIndices(
          primitive.getMode(),
          indices ? indices.getArray() : null,
          position.getCount()
        );
        if (tris.length > 0) {
          triangleCount += tris.length / 3;
          if (triangleCount > MAX_TRIANGLES) {
            throw new GlbRenderError(
              `Model has more than ${MAX_TRIANGLES} triangles`
            );
          }
          const positions = worldPositions(position, world);

          const material = primitive.getMaterial();
          const factor = material
            ? material.getBaseColorFactor()
            : [1, 1, 1, 1];
          const textureInfo = material && material.getBaseColorTextureInfo();
          // eslint-disable-next-line no-await-in-loop
          const texture = await decodeTexture(
            material && material.getBaseColorTexture(),
            textureCache
          );
          const texCoord = primitive.getAttribute(
            `TEXCOORD_${textureInfo ? textureInfo.getTexCoord() : 0}`
          );
          const color = primitive.getAttribute('COLOR_0');

          const colors = color ? readComponents(color, 4) : null;
          const uvs = texture && texCoord ? readComponents(texCoord, 2) : null;

          primitives.push({
            positions,
            colors,
            uvs,
            texture: uvs ? texture : null,
            factor,
            alphaCutoff:
              material && material.getAlphaMode() === 'MASK'
                ? material.getAlphaCutoff()
                : null,
            tris,
          });
        }
      }
    }
  }
  return primitives;
};

/**
 * Camera basis and projection of world points to the image plane, before the
 * 2D fit: x right, y down, w = distance along the view direction.
 */
const buildCamera = (primitives) => {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  primitives.forEach(({ positions }) => {
    for (let i = 0; i < positions.length; i += 3) {
      for (let k = 0; k < 3; k += 1) {
        const v = positions[i + k];
        if (v < min[k]) min[k] = v;
        if (v > max[k]) max[k] = v;
      }
    }
  });
  const center = min.map((v, k) => (v + max[k]) / 2);
  let radius = 0;
  primitives.forEach(({ positions }) => {
    for (let i = 0; i < positions.length; i += 3) {
      const dx = positions[i] - center[0];
      const dy = positions[i + 1] - center[1];
      const dz = positions[i + 2] - center[2];
      radius = Math.max(radius, Math.sqrt(dx * dx + dy * dy + dz * dz));
    }
  });
  if (!Number.isFinite(radius) || radius === 0) {
    throw new GlbRenderError('Model has no visible extent');
  }

  // back: from the center towards the camera
  const back = [
    Math.sin(AZIMUTH) * Math.cos(ELEVATION),
    Math.sin(ELEVATION),
    Math.cos(AZIMUTH) * Math.cos(ELEVATION),
  ];
  const right = [back[2], 0, -back[0]];
  const rightLength = Math.hypot(...right);
  right.forEach((v, k) => {
    right[k] = v / rightLength;
  });
  // up = back × right
  const up = [
    back[1] * right[2] - back[2] * right[1],
    back[2] * right[0] - back[0] * right[2],
    back[0] * right[1] - back[1] * right[0],
  ];
  // The whole bounding sphere lies in front of the camera
  const distance = radius / Math.sin(FOV_Y / 2);
  const eye = center.map((v, k) => v + back[k] * distance);
  const focal = 1 / Math.tan(FOV_Y / 2);

  return {
    back,
    /**
     * @param {Float64Array} positions - World x, y, z per vertex
     * @returns {Float64Array} Image plane x, y and depth w per vertex
     */
    project(positions) {
      const out = new Float64Array(positions.length);
      for (let i = 0; i < positions.length; i += 3) {
        const dx = positions[i] - eye[0];
        const dy = positions[i + 1] - eye[1];
        const dz = positions[i + 2] - eye[2];
        const w = -(dx * back[0] + dy * back[1] + dz * back[2]);
        out[i] = (focal * (dx * right[0] + dy * right[1] + dz * right[2])) / w;
        out[i + 1] = (-focal * (dx * up[0] + dy * up[1] + dz * up[2])) / w;
        out[i + 2] = w;
      }
      return out;
    },
  };
};

const rasterize = (primitives, camera) => {
  const projected = primitives.map(({ positions }) =>
    camera.project(positions)
  );

  // Fit the projected model in the frame: a 2D scale and offset of the image
  // plane, i.e. an off-axis camera with a tighter field of view
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  primitives.forEach(({ tris }, p) => {
    const pts = projected[p];
    for (let i = 0; i < tris.length; i += 1) {
      const j = tris[i] * 3;
      minX = Math.min(minX, pts[j]);
      maxX = Math.max(maxX, pts[j]);
      minY = Math.min(minY, pts[j + 1]);
      maxY = Math.max(maxY, pts[j + 1]);
    }
  });
  const spanX = Math.max(maxX - minX, 1e-9);
  const spanY = Math.max(maxY - minY, 1e-9);
  const scale = Math.min(
    (WIDTH * (1 - 2 * MARGIN)) / spanX,
    (HEIGHT * (1 - 2 * MARGIN)) / spanY
  );
  const offsetX = WIDTH / 2 - ((minX + maxX) / 2) * scale;
  const offsetY = HEIGHT / 2 - ((minY + maxY) / 2) * scale;

  const color = new Float32Array(WIDTH * HEIGHT * 3);
  const alpha = new Uint8Array(WIDTH * HEIGHT);
  // Depth buffer holds 1/w: larger is closer, 0 is empty
  const depth = new Float32Array(WIDTH * HEIGHT);
  let drawn = 0;
  // Key light from the camera, raised towards the top of the frame
  const light = [camera.back[0], camera.back[1] + 0.6, camera.back[2]];
  const lightLength = Math.hypot(...light);
  light.forEach((v, k) => {
    light[k] = v / lightLength;
  });

  primitives.forEach((prim, p) => {
    const { positions, colors, uvs, texture, factor, alphaCutoff, tris } = prim;
    const pts = projected[p];
    for (let t = 0; t < tris.length; t += 3) {
      const a = tris[t];
      const b = tris[t + 1];
      const c = tris[t + 2];
      const ax = pts[a * 3] * scale + offsetX;
      const ay = pts[a * 3 + 1] * scale + offsetY;
      const bx = pts[b * 3] * scale + offsetX;
      const by = pts[b * 3 + 1] * scale + offsetY;
      const cx = pts[c * 3] * scale + offsetX;
      const cy = pts[c * 3 + 1] * scale + offsetY;
      const area = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
      // eslint-disable-next-line no-continue
      if (area === 0 || Number.isNaN(area)) continue;

      // Flat shading from the world-space face normal, lit on both sides
      const e1x = positions[b * 3] - positions[a * 3];
      const e1y = positions[b * 3 + 1] - positions[a * 3 + 1];
      const e1z = positions[b * 3 + 2] - positions[a * 3 + 2];
      const e2x = positions[c * 3] - positions[a * 3];
      const e2y = positions[c * 3 + 1] - positions[a * 3 + 1];
      const e2z = positions[c * 3 + 2] - positions[a * 3 + 2];
      const nx = e1y * e2z - e1z * e2y;
      const ny = e1z * e2x - e1x * e2z;
      const nz = e1x * e2y - e1y * e2x;
      const nLength = Math.hypot(nx, ny, nz) || 1;
      const lambert =
        Math.abs(nx * light[0] + ny * light[1] + nz * light[2]) / nLength;
      const shade = AMBIENT + (1 - AMBIENT) * lambert;

      const ia = 1 / pts[a * 3 + 2];
      const ib = 1 / pts[b * 3 + 2];
      const ic = 1 / pts[c * 3 + 2];

      const x0 = Math.max(0, Math.floor(Math.min(ax, bx, cx)));
      const x1 = Math.min(WIDTH - 1, Math.ceil(Math.max(ax, bx, cx)));
      const y0 = Math.max(0, Math.floor(Math.min(ay, by, cy)));
      const y1 = Math.min(HEIGHT - 1, Math.ceil(Math.max(ay, by, cy)));

      for (let y = y0; y <= y1; y += 1) {
        const py = y + 0.5;
        for (let x = x0; x <= x1; x += 1) {
          const px = x + 0.5;
          // Barycentric weights, the same sign as area inside the triangle
          const wa = ((bx - px) * (cy - py) - (by - py) * (cx - px)) / area;
          const wb = ((cx - px) * (ay - py) - (cy - py) * (ax - px)) / area;
          const wc = 1 - wa - wb;
          // eslint-disable-next-line no-continue
          if (wa < 0 || wb < 0 || wc < 0) continue;
          const invW = wa * ia + wb * ib + wc * ic;
          const pixel = y * WIDTH + x;
          // eslint-disable-next-line no-continue
          if (invW <= depth[pixel]) continue;

          // Perspective-correct weights for attribute interpolation
          const pa = (wa * ia) / invW;
          const pb = (wb * ib) / invW;
          const pc = (wc * ic) / invW;

          let r = factor[0];
          let g = factor[1];
          let bl = factor[2];
          let alphaValue = factor[3];
          if (colors) {
            r *= pa * colors[a * 4] + pb * colors[b * 4] + pc * colors[c * 4];
            g *=
              pa * colors[a * 4 + 1] +
              pb * colors[b * 4 + 1] +
              pc * colors[c * 4 + 1];
            bl *=
              pa * colors[a * 4 + 2] +
              pb * colors[b * 4 + 2] +
              pc * colors[c * 4 + 2];
            alphaValue *=
              pa * colors[a * 4 + 3] +
              pb * colors[b * 4 + 3] +
              pc * colors[c * 4 + 3];
          }
          if (texture) {
            const u = pa * uvs[a * 2] + pb * uvs[b * 2] + pc * uvs[c * 2];
            const v =
              pa * uvs[a * 2 + 1] + pb * uvs[b * 2 + 1] + pc * uvs[c * 2 + 1];
            // Nearest texel, repeat wrapping
            const tx = Math.min(
              texture.width - 1,
              Math.floor((u - Math.floor(u)) * texture.width)
            );
            const ty = Math.min(
              texture.height - 1,
              Math.floor((v - Math.floor(v)) * texture.height)
            );
            const texel = (ty * texture.width + tx) * 4;
            r *= SRGB_TO_LINEAR[texture.data[texel]];
            g *= SRGB_TO_LINEAR[texture.data[texel + 1]];
            bl *= SRGB_TO_LINEAR[texture.data[texel + 2]];
            alphaValue *= texture.data[texel + 3] / 255;
          }
          // eslint-disable-next-line no-continue
          if (alphaCutoff !== null && alphaValue < alphaCutoff) continue;

          depth[pixel] = invW;
          if (!alpha[pixel]) drawn += 1;
          alpha[pixel] = 255;
          color[pixel * 3] = r * shade;
          color[pixel * 3 + 1] = g * shade;
          color[pixel * 3 + 2] = bl * shade;
        }
      }
    }
  });

  if (drawn === 0) {
    throw new GlbRenderError('Model covers no pixel');
  }

  const rgba = Buffer.alloc(WIDTH * HEIGHT * 4);
  for (let pixel = 0; pixel < WIDTH * HEIGHT; pixel += 1) {
    if (alpha[pixel]) {
      rgba[pixel * 4] = linearToSrgb8(color[pixel * 3]);
      rgba[pixel * 4 + 1] = linearToSrgb8(color[pixel * 3 + 1]);
      rgba[pixel * 4 + 2] = linearToSrgb8(color[pixel * 3 + 2]);
      rgba[pixel * 4 + 3] = 255;
    }
  }
  return rgba;
};

/**
 * Render a GLB model to a PNG preview.
 * @param {Buffer|Uint8Array} glbBuffer - The GLB file content
 * @returns {Promise<Buffer>} A WIDTH × HEIGHT PNG with a transparent background
 * @throws {GlbRenderError} When the model has nothing to render or is too large
 * @throws {Error} When the file is not a readable GLB
 */
const renderGlb = async (glbBuffer) => {
  const io = await getIO();
  const document = await io.readBinary(new Uint8Array(glbBuffer));
  const primitives = await collectPrimitives(document);
  if (primitives.length === 0) {
    throw new GlbRenderError('Model has no triangle to render');
  }
  const camera = buildCamera(primitives);
  const rgba = rasterize(primitives, camera);
  return sharp(rgba, { raw: { width: WIDTH, height: HEIGHT, channels: 4 } })
    .png()
    .toBuffer();
};

/**
 * Render a GLB model to a PNG preview in a worker thread.
 * @param {Buffer|Uint8Array} glbBuffer - The GLB file content
 * @param {object} [opts]
 * @param {number} [opts.timeoutMs] - The worker is terminated past this delay
 * @returns {Promise<Buffer>} See renderGlb
 * @throws {GlbRenderError} When the model cannot be rendered, the worker
 *   crashes or the rendering times out
 */
const renderGlbInWorker = (glbBuffer, { timeoutMs = WORKER_TIMEOUT_MS } = {}) =>
  new Promise((resolve, reject) => {
    const worker = new Worker(path.join(__dirname, 'glbRenderWorker.js'), {
      workerData: { glb: glbBuffer },
      resourceLimits: { maxOldGenerationSizeMb: WORKER_MAX_HEAP_MB },
    });
    let settled = false;
    let timer = null;
    const settle = (fn, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      worker.terminate();
      fn(value);
    };
    timer = setTimeout(
      () =>
        settle(
          reject,
          new GlbRenderError(`Rendering timed out after ${timeoutMs} ms`)
        ),
      timeoutMs
    );
    worker.on('message', ({ png, error }) => {
      if (error) {
        settle(
          reject,
          error.name === GlbRenderError.name
            ? new GlbRenderError(error.message)
            : new Error(error.message)
        );
      } else {
        settle(resolve, Buffer.from(png));
      }
    });
    worker.on('error', (err) =>
      settle(reject, new GlbRenderError(`Render worker failed: ${err.message}`))
    );
    worker.on('exit', (code) =>
      settle(
        reject,
        new GlbRenderError(`Render worker exited with code ${code}`)
      )
    );
  });

module.exports = {
  WIDTH,
  HEIGHT,
  MAX_TRIANGLES,
  GlbRenderError,
  renderGlb,
  renderGlbInWorker,
};
