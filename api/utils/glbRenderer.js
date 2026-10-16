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
// Memory budgets, checked against the sizes the GLB declares before anything
// is decoded: a tiny file can declare huge accessors, and neither ArrayBuffers
// nor WASM memory count towards the worker heap limit. Together with the frame
// buffers (~60 MB) they bound the rendering to well under 1 GB.
const MiB = 1024 * 1024;
// Typed arrays @gltf-transform allocates for the accessors and the decoded
// meshopt buffer views
const MAX_DECODED_BYTES = 192 * MiB;
// World and projected positions (2 × 3 doubles), vertex colors (4 floats),
// UVs (2 floats) and triangle indices (uint32) of every mesh instance
const MAX_GEOMETRY_BYTES = 320 * MiB;
const GEOMETRY_BYTES_PER_VERTEX = 48;
const COLOR_BYTES_PER_VERTEX = 16;
const UV_BYTES_PER_VERTEX = 8;
const BYTES_PER_INDEX = 4;
// Decoded RGBA textures, shared out between the textures of the model
const MAX_TEXTURE_BYTES = 96 * MiB;
// Embedded textures are downsized before sampling to bound memory use
const MAX_TEXTURE_SIZE = 2048;
// Larger embedded images are not decoded (base color factor only)
const MAX_TEXTURE_INPUT_PIXELS = 8192 * 8192;
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
const TRIANGLE_MODES = [MODE_TRIANGLES, MODE_TRIANGLE_STRIP, MODE_TRIANGLE_FAN];

const GLB_MAGIC = 0x46546c67; // 'glTF'
const GLB_JSON_CHUNK = 0x4e4f534a; // 'JSON'
const COMPONENT_BYTES = {
  5120: 1,
  5121: 1,
  5122: 2,
  5123: 2,
  5125: 4,
  5126: 4,
};
const TYPE_COMPONENTS = {
  SCALAR: 1,
  VEC2: 2,
  VEC3: 3,
  VEC4: 4,
  MAT2: 4,
  MAT3: 9,
  MAT4: 16,
};

class GlbRenderError extends Error {}

/**
 * Read the JSON chunk of a GLB without decoding anything else.
 * @returns {object|null} null when the buffer is not a GLB (left to the parser)
 */
const readGlbJson = (glbBuffer) => {
  const buffer = Buffer.from(
    glbBuffer.buffer,
    glbBuffer.byteOffset,
    glbBuffer.byteLength
  );
  if (buffer.length < 20 || buffer.readUInt32LE(0) !== GLB_MAGIC) return null;
  const jsonLength = buffer.readUInt32LE(12);
  if (
    buffer.readUInt32LE(16) !== GLB_JSON_CHUNK ||
    20 + jsonLength > buffer.length
  ) {
    return null;
  }
  try {
    return JSON.parse(buffer.toString('utf8', 20, 20 + jsonLength));
  } catch (err) {
    return null;
  }
};

const nonNegativeInteger = (value, what) => {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new GlbRenderError(`Model has an invalid ${what}`);
  }
  return value;
};

const accessorCount = (accessor) =>
  nonNegativeInteger(accessor && accessor.count, 'accessor');

/**
 * Refuse a model whose declared sizes exceed the memory budgets, before
 * @gltf-transform expands its accessors.
 * @param {object} json - The glTF JSON of the GLB
 * @throws {GlbRenderError}
 */
const checkDeclaredSizes = (json) => {
  const accessors = json.accessors || [];

  let decodedBytes = 0;
  accessors.forEach((accessor) => {
    const components = TYPE_COMPONENTS[accessor.type] || 16;
    const bytes = COMPONENT_BYTES[accessor.componentType] || 4;
    decodedBytes += accessorCount(accessor) * components * bytes;
  });
  // Every meshopt view is decoded into count × byteStride bytes, whether an
  // accessor uses it or not
  (json.bufferViews || []).forEach((view) => {
    const meshopt = view.extensions && view.extensions.EXT_meshopt_compression;
    if (meshopt) {
      decodedBytes +=
        nonNegativeInteger(meshopt.count, 'buffer view') *
        nonNegativeInteger(meshopt.byteStride, 'buffer view');
    }
  });
  if (decodedBytes > MAX_DECODED_BYTES) {
    throw new GlbRenderError(
      `Model declares ${Math.round(decodedBytes / MiB)} MiB of data, more than ${MAX_DECODED_BYTES / MiB} MiB`
    );
  }

  // Every node of the scene with a mesh is one instance of its geometry
  const nodes = json.nodes || [];
  const scenes = json.scenes || [];
  const scene = scenes[Number.isInteger(json.scene) ? json.scene : 0];
  const pending = [...((scene && scene.nodes) || [])];
  const visited = new Set();
  const instances = [];
  while (pending.length > 0) {
    const index = pending.pop();
    const node = nodes[index];
    if (node && !visited.has(index)) {
      visited.add(index);
      pending.push(...(node.children || []));
      const mesh =
        Number.isInteger(node.mesh) && (json.meshes || [])[node.mesh];
      if (mesh) instances.push(...(mesh.primitives || []));
    }
  }

  let geometryBytes = 0;
  let triangles = 0;
  instances.forEach((primitive) => {
    const mode = primitive.mode === undefined ? MODE_TRIANGLES : primitive.mode;
    const attributes = primitive.attributes || {};
    if (TRIANGLE_MODES.includes(mode) && attributes.POSITION !== undefined) {
      const vertices = accessorCount(accessors[attributes.POSITION]);
      const indices =
        primitive.indices === undefined
          ? vertices
          : accessorCount(accessors[primitive.indices]);
      const primitiveTriangles =
        mode === MODE_TRIANGLES
          ? Math.floor(indices / 3)
          : Math.max(0, indices - 2);
      triangles += primitiveTriangles;
      geometryBytes +=
        vertices *
          (GEOMETRY_BYTES_PER_VERTEX +
            COLOR_BYTES_PER_VERTEX +
            UV_BYTES_PER_VERTEX) +
        primitiveTriangles * 3 * BYTES_PER_INDEX;
    }
  });
  if (triangles > MAX_TRIANGLES) {
    throw new GlbRenderError(`Model has more than ${MAX_TRIANGLES} triangles`);
  }
  if (geometryBytes > MAX_GEOMETRY_BYTES) {
    throw new GlbRenderError(
      `Model geometry needs ${Math.round(geometryBytes / MiB)} MiB, more than ${MAX_GEOMETRY_BYTES / MiB} MiB`
    );
  }
};

/**
 * Check what @gltf-transform actually decoded: Draco streams carry their own
 * vertex counts, which the declared accessors may understate.
 * @throws {GlbRenderError}
 */
const checkDecodedSizes = (document) => {
  const decodedBytes = document
    .getRoot()
    .listAccessors()
    .reduce((sum, accessor) => sum + accessor.getByteLength(), 0);
  if (decodedBytes > MAX_DECODED_BYTES) {
    throw new GlbRenderError(
      `Model decodes to ${Math.round(decodedBytes / MiB)} MiB of data, more than ${MAX_DECODED_BYTES / MiB} MiB`
    );
  }
};

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

const decodeTexture = async (texture, cache, maxSize) => {
  if (!texture) return null;
  if (cache.has(texture)) return cache.get(texture);
  let decoded = null;
  try {
    const { data, info } = await sharp(Buffer.from(texture.getImage()), {
      limitInputPixels: MAX_TEXTURE_INPUT_PIXELS,
    })
      .resize({
        width: maxSize,
        height: maxSize,
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

  // Share the texture budget out between the base color textures in use
  const textures = new Set();
  meshNodes.forEach((node) =>
    node
      .getMesh()
      .listPrimitives()
      .forEach((primitive) => {
        const material = primitive.getMaterial();
        const texture = material && material.getBaseColorTexture();
        if (texture) textures.add(texture);
      })
  );
  const textureSize = Math.min(
    MAX_TEXTURE_SIZE,
    Math.floor(Math.sqrt(MAX_TEXTURE_BYTES / 4 / Math.max(1, textures.size)))
  );

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
            textureCache,
            textureSize
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
 * @throws {GlbRenderError} When the model has nothing to render or exceeds
 *   the triangle or memory budgets
 * @throws {Error} When the file is not a readable GLB
 */
const renderGlb = async (glbBuffer) => {
  const bytes = new Uint8Array(glbBuffer);
  const json = readGlbJson(bytes);
  if (json) checkDeclaredSizes(json);
  const io = await getIO();
  const document = await io.readBinary(bytes);
  checkDecodedSizes(document);
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
  MAX_DECODED_BYTES,
  MAX_GEOMETRY_BYTES,
  GlbRenderError,
  renderGlb,
  renderGlbInWorker,
};
