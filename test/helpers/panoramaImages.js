/**
 * Small generated images for the panorama tests (#2007), with or without
 * Google Photo Sphere (GPano) XMP metadata.
 */
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

module.exports = { gpanoXmp, sphereGPano, makeImage };
