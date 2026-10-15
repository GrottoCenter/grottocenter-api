/**
 * Shared GLB test helper — builds small GLB models in memory with
 * @gltf-transform/core, and reads back rendered PNG previews.
 */

const { Document, NodeIO } = require('@gltf-transform/core');
const { KHRDracoMeshCompression } = require('@gltf-transform/extensions');
const draco3d = require('draco3dgltf');
const sharp = require('sharp');

// A unit cube centered on the origin, one quad per face (no shared vertices)
const CUBE_FACES = [
  [
    [1, -1, -1],
    [1, 1, -1],
    [1, 1, 1],
    [1, -1, 1],
  ],
  [
    [-1, -1, 1],
    [-1, 1, 1],
    [-1, 1, -1],
    [-1, -1, -1],
  ],
  [
    [-1, 1, -1],
    [-1, 1, 1],
    [1, 1, 1],
    [1, 1, -1],
  ],
  [
    [-1, -1, 1],
    [-1, -1, -1],
    [1, -1, -1],
    [1, -1, 1],
  ],
  [
    [-1, -1, 1],
    [1, -1, 1],
    [1, 1, 1],
    [-1, 1, 1],
  ],
  [
    [1, -1, -1],
    [-1, -1, -1],
    [-1, 1, -1],
    [1, 1, -1],
  ],
];

let encoderIO = null;
const getIO = async () => {
  if (!encoderIO) {
    encoderIO = new NodeIO()
      .registerExtensions([KHRDracoMeshCompression])
      .registerDependencies({
        'draco3d.encoder': await draco3d.createEncoderModule(),
        'draco3d.decoder': await draco3d.createDecoderModule(),
      });
  }
  return encoderIO;
};

/**
 * Build a cube GLB.
 * @param {object} [opts]
 * @param {number[]} [opts.baseColor] - Material base color factor (RGBA, linear)
 * @param {number[]} [opts.vertexColor] - COLOR_0 for every vertex (RGB or
 *   RGBA, linear)
 * @param {string} [opts.alphaMode] - Material alpha mode (OPAQUE, MASK, BLEND)
 * @param {Buffer} [opts.texturePng] - Embedded base color texture
 * @param {object} [opts.node] - translation / rotation / scale of the node
 * @param {boolean} [opts.draco] - Compress the mesh with Draco
 * @param {boolean} [opts.collapsed] - Put every vertex at the origin
 * @returns {Promise<Uint8Array>}
 */
const cubeGlb = async ({
  baseColor = [1, 1, 1, 1],
  vertexColor = null,
  alphaMode = 'OPAQUE',
  texturePng = null,
  node = {},
  draco = false,
  collapsed = false,
} = {}) => {
  const doc = new Document();
  const buffer = doc.createBuffer();
  const positions = [];
  const uvs = [];
  const indices = [];
  CUBE_FACES.forEach((face, f) => {
    face.forEach((p) => positions.push(...(collapsed ? [0, 0, 0] : p)));
    uvs.push(0, 0, 1, 0, 1, 1, 0, 1);
    const o = f * 4;
    indices.push(o, o + 1, o + 2, o, o + 2, o + 3);
  });

  const primitive = doc
    .createPrimitive()
    .setAttribute(
      'POSITION',
      doc
        .createAccessor()
        .setType('VEC3')
        .setArray(new Float32Array(positions))
        .setBuffer(buffer)
    )
    .setIndices(
      doc
        .createAccessor()
        .setType('SCALAR')
        .setArray(new Uint16Array(indices))
        .setBuffer(buffer)
    );

  if (vertexColor) {
    const colors = positions.flatMap((_, i) =>
      i % 3 === 0 ? vertexColor : []
    );
    primitive.setAttribute(
      'COLOR_0',
      doc
        .createAccessor()
        .setType(vertexColor.length === 4 ? 'VEC4' : 'VEC3')
        .setArray(new Float32Array(colors))
        .setBuffer(buffer)
    );
  }

  const material = doc
    .createMaterial()
    .setBaseColorFactor(baseColor)
    .setAlphaMode(alphaMode);
  if (texturePng) {
    primitive.setAttribute(
      'TEXCOORD_0',
      doc
        .createAccessor()
        .setType('VEC2')
        .setArray(new Float32Array(uvs))
        .setBuffer(buffer)
    );
    material.setBaseColorTexture(
      doc.createTexture().setImage(texturePng).setMimeType('image/png')
    );
  }
  primitive.setMaterial(material);

  const cube = doc
    .createNode()
    .setMesh(doc.createMesh().addPrimitive(primitive));
  if (node.translation) cube.setTranslation(node.translation);
  if (node.rotation) cube.setRotation(node.rotation);
  if (node.scale) cube.setScale(node.scale);
  doc.createScene().addChild(cube);

  if (draco) {
    doc.createExtension(KHRDracoMeshCompression).setRequired(true);
  }
  return (await getIO()).writeBinary(doc);
};

/**
 * A GLB whose scene holds a node without mesh.
 * @returns {Promise<Uint8Array>}
 */
const emptySceneGlb = async () => {
  const doc = new Document();
  doc.createScene().addChild(doc.createNode());
  return (await getIO()).writeBinary(doc);
};

/**
 * Decode a PNG and expose pixel lookups.
 * @param {Buffer} png
 */
const readPixels = async (png) => {
  const { data, info } = await sharp(png)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const at = (x, y) => {
    const i = (y * info.width + x) * 4;
    return { r: data[i], g: data[i + 1], b: data[i + 2], a: data[i + 3] };
  };
  // Bounding box of the opaque pixels
  const opaqueBox = () => {
    const box = { minX: Infinity, minY: Infinity, maxX: -1, maxY: -1 };
    for (let y = 0; y < info.height; y += 1) {
      for (let x = 0; x < info.width; x += 1) {
        if (data[(y * info.width + x) * 4 + 3] > 0) {
          box.minX = Math.min(box.minX, x);
          box.maxX = Math.max(box.maxX, x);
          box.minY = Math.min(box.minY, y);
          box.maxY = Math.max(box.maxY, y);
        }
      }
    }
    return box;
  };
  return { width: info.width, height: info.height, at, opaqueBox };
};

/**
 * A single-color PNG.
 * @param {{r: number, g: number, b: number}} background
 * @returns {Promise<Buffer>}
 */
const solidPng = (background) =>
  sharp({ create: { width: 4, height: 4, channels: 3, background } })
    .png()
    .toBuffer();

/**
 * A GLB made of a JSON chunk only: accessors without buffer views are
 * zero-filled, so a few hundred bytes can declare any amount of data.
 * @param {object} json - The glTF JSON, without asset
 * @returns {Buffer}
 */
const declaredOnlyGlb = (json) => {
  let chunk = Buffer.from(
    JSON.stringify({ asset: { version: '2.0' }, ...json })
  );
  chunk = Buffer.concat([
    chunk,
    Buffer.alloc((4 - (chunk.length % 4)) % 4, 0x20),
  ]);
  const header = Buffer.alloc(20);
  header.writeUInt32LE(0x46546c67, 0); // 'glTF'
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(20 + chunk.length, 8);
  header.writeUInt32LE(chunk.length, 12);
  header.writeUInt32LE(0x4e4f534a, 16); // 'JSON'
  return Buffer.concat([header, chunk]);
};

/**
 * A GLB whose single mesh has a POSITION accessor declaring `count` vertices
 * and no data.
 * @param {object} accessor - Overrides of the POSITION accessor
 * @returns {Buffer}
 */
const oversizedGlb = (accessor) =>
  declaredOnlyGlb({
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }],
    accessors: [{ componentType: 5126, type: 'VEC3', ...accessor }],
  });

module.exports = {
  cubeGlb,
  declaredOnlyGlb,
  emptySceneGlb,
  oversizedGlb,
  readPixels,
  solidPng,
};
