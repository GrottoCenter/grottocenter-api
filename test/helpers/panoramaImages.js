/**
 * Small generated images for the panorama tests (#2007), with or without
 * Google Photo Sphere (GPano) XMP metadata.
 */
const zlib = require('zlib');
const sharp = require('sharp');

const GPANO_NS = 'http://ns.google.com/photos/1.0/panorama/';

/**
 * An XMP packet with the given GPano properties, in attribute form.
 * @param {Object<string, string|number|boolean>} properties
 * @param {string} [prefix] prefix bound to the GPano namespace
 */
const gpanoXmp = (properties, prefix = 'GPano') => {
  const attributes = Object.entries(properties)
    .map(([name, value]) => `${prefix}:${name}="${value}"`)
    .join(' ');
  return (
    '<x:xmpmeta xmlns:x="adobe:ns:meta/">' +
    '<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">' +
    `<rdf:Description rdf:about="" xmlns:${prefix}="${GPANO_NS}" ${attributes}/>` +
    '</rdf:RDF></x:xmpmeta>'
  );
};

// GPano of a complete sphere of the given size.
const sphereGPano = (width, height, overrides = {}) => ({
  UsePanoramaViewer: 'True',
  ProjectionType: 'equirectangular',
  FullPanoWidthPixels: width,
  FullPanoHeightPixels: height,
  CroppedAreaImageWidthPixels: width,
  CroppedAreaImageHeightPixels: height,
  CroppedAreaLeftPixels: 0,
  CroppedAreaTopPixels: 0,
  ...overrides,
});

/**
 * @param {Object} options
 * @param {number} options.width
 * @param {number} options.height
 * @param {'jpeg'|'png'|'webp'|'gif'|'tiff'} [options.format]
 * @param {string} [options.xmp] XMP packet to embed
 * @returns {Promise<Buffer>}
 */
const makeImage = async ({ width, height, format = 'jpeg', xmp }) => {
  let pipeline = sharp({
    create: { width, height, channels: 3, background: '#556677' },
  })[format]();
  if (xmp) pipeline = pipeline.withXmp(xmp);
  return pipeline.toBuffer();
};

const pngChunk = (type, data) => {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(zlib.crc32(body));
  return Buffer.concat([length, body, crc]);
};

/**
 * A valid animated PNG (APNG) of two identical frames, built from the still
 * PNG makeImage() generates, metadata included.
 * @param {Object} options same as makeImage(), without format
 * @returns {Promise<Buffer>}
 */
const makeAnimatedPng = async (options) => {
  const { width, height } = options;
  const png = await makeImage({ ...options, format: 'png' });
  const chunks = [];
  for (let offset = 8; offset < png.length;) {
    const length = png.readUInt32BE(offset);
    chunks.push({
      type: png.toString('latin1', offset + 4, offset + 8),
      data: png.subarray(offset + 8, offset + 8 + length),
    });
    offset += 12 + length;
  }
  const image = Buffer.concat(
    chunks.filter(({ type }) => type === 'IDAT').map(({ data }) => data)
  );
  const frameControl = (sequence) => {
    const data = Buffer.alloc(26);
    data.writeUInt32BE(sequence, 0);
    data.writeUInt32BE(width, 4);
    data.writeUInt32BE(height, 8);
    data.writeUInt16BE(1, 20); // delay numerator
    data.writeUInt16BE(10, 22); // delay denominator
    return data;
  };
  const animationControl = Buffer.alloc(8);
  animationControl.writeUInt32BE(2, 0); // frames, then 0 plays: infinite loop
  const frameDataSequence = Buffer.alloc(4);
  frameDataSequence.writeUInt32BE(2);
  return Buffer.concat([
    png.subarray(0, 8),
    ...chunks
      .filter(({ type }) => type !== 'IDAT' && type !== 'IEND')
      .map(({ type, data }) => pngChunk(type, data)),
    pngChunk('acTL', animationControl),
    pngChunk('fcTL', frameControl(0)),
    pngChunk('IDAT', image),
    pngChunk('fcTL', frameControl(1)),
    pngChunk('fdAT', Buffer.concat([frameDataSequence, image])),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
};

module.exports = { gpanoXmp, sphereGPano, makeImage, makeAnimatedPng };
