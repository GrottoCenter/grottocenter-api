const should = require('should');
const {
  REASONS,
  parsePanoramaFlag,
  readGPano,
  detectPanorama,
  checkManualPanorama,
  readImageInfo,
} = require('../../../api/utils/panorama');
const {
  gpanoXmp,
  sphereGPano,
  makeImage,
} = require('../../helpers/panoramaImages');

const infoOf = async (options) => readImageInfo(await makeImage(options));

describe('panorama utils (#2007)', () => {
  describe('parsePanoramaFlag()', () => {
    it('should read JSON booleans and multipart strings', () => {
      should(parsePanoramaFlag(true)).be.true();
      should(parsePanoramaFlag('true')).be.true();
      should(parsePanoramaFlag(false)).be.false();
      should(parsePanoramaFlag('false')).be.false();
    });

    it('should leave an omitted flag undefined', () => {
      should(parsePanoramaFlag(undefined)).be.undefined();
    });

    [null, '', 'TRUE', 'False', '1', '0', 1, 0, 'yes', ' true', [], {}].forEach(
      (value) => {
        it(`should reject ${JSON.stringify(value)}`, () => {
          should(parsePanoramaFlag(value)).equal(parsePanoramaFlag.INVALID);
        });
      }
    );
  });

  describe('readGPano()', () => {
    it('should read the attribute form', () => {
      should(readGPano(gpanoXmp({ ProjectionType: 'equirectangular' }))).eql({
        ProjectionType: 'equirectangular',
      });
    });

    it('should read the element form, whatever the prefix', () => {
      const xmp =
        '<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">' +
        '<rdf:Description rdf:about="" xmlns:pano="http://ns.google.com/photos/1.0/panorama/">' +
        '<pano:ProjectionType>equirectangular</pano:ProjectionType>' +
        '<pano:FullPanoWidthPixels> 8000 </pano:FullPanoWidthPixels>' +
        '</rdf:Description></rdf:RDF></x:xmpmeta>';
      should(readGPano(xmp)).eql({
        ProjectionType: 'equirectangular',
        FullPanoWidthPixels: '8000',
      });
    });

    it('should ignore properties of another namespace', () => {
      const xmp =
        '<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:Description xmlns:GPano="http://example.org/other/" GPano:ProjectionType="equirectangular"/></x:xmpmeta>';
      should(readGPano(xmp)).be.null();
    });

    it('should resolve the GPano prefix in its scope only', () => {
      const xmp =
        '<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">' +
        '<rdf:Description rdf:about="" xmlns:GPano="http://ns.google.com/photos/1.0/panorama/" GPano:FullPanoWidthPixels="64"/>' +
        '<rdf:Description rdf:about="" GPano:ProjectionType="equirectangular"/>' +
        '<rdf:Description rdf:about="" xmlns:GPano="http://example.org/other/" GPano:FullPanoHeightPixels="32"/>' +
        '</rdf:RDF></x:xmpmeta>';
      should(readGPano(xmp)).eql({ FullPanoWidthPixels: '64' });
    });

    it('should read a packet wrapped in xpacket processing instructions', () => {
      const xmp = `<?xpacket begin="\uFEFF" id="W5M0MpCehiHzreSzNTczkc9d"?>${gpanoXmp(
        { ProjectionType: 'equirectangular' }
      )}<?xpacket end="w"?>`;
      should(readGPano(xmp)).eql({ ProjectionType: 'equirectangular' });
    });

    it('should return null for a malformed packet', () => {
      const xmp = gpanoXmp({ ProjectionType: 'equirectangular' });
      should(readGPano(xmp.split('/>')[0])).be.null();
      should(readGPano(xmp.replace('</rdf:RDF>', ''))).be.null();
    });

    it('should return null without XMP', () => {
      should(readGPano(null)).be.null();
      should(readGPano('')).be.null();
      should(readGPano('<x:xmpmeta/>')).be.null();
    });
  });

  describe('detectPanorama()', () => {
    it('should detect a complete JPEG sphere with valid GPano metadata', async () => {
      const info = await infoOf({
        width: 64,
        height: 32,
        xmp: gpanoXmp(sphereGPano(64, 32)),
      });
      should(detectPanorama(info)).be.true();
    });

    it('should detect a resized sphere whose metadata keeps the original size', async () => {
      const info = await infoOf({
        width: 64,
        height: 32,
        xmp: gpanoXmp(sphereGPano(8192, 4096)),
      });
      should(detectPanorama(info)).be.true();
    });

    it('should detect PNG and WebP spheres', async () => {
      for (const format of ['png', 'webp']) {
        // eslint-disable-next-line no-await-in-loop
        const info = await infoOf({
          width: 64,
          height: 32,
          format,
          xmp: gpanoXmp(sphereGPano(64, 32)),
        });
        should(detectPanorama(info)).be.true();
      }
    });

    it('should not detect a 2:1 image without GPano metadata', async () => {
      should(
        detectPanorama(await infoOf({ width: 64, height: 32 }))
      ).be.false();
    });

    const rejected = [
      [
        'UsePanoramaViewer=false',
        sphereGPano(64, 32, { UsePanoramaViewer: 'False' }),
      ],
      [
        'a malformed UsePanoramaViewer',
        sphereGPano(64, 32, { UsePanoramaViewer: 'maybe' }),
      ],
      [
        'a cylindrical projection',
        sphereGPano(64, 32, { ProjectionType: 'cylindrical' }),
      ],
      [
        'a missing projection',
        sphereGPano(64, 32, { ProjectionType: undefined }),
      ],
      [
        'a partial coverage',
        sphereGPano(64, 32, {
          CroppedAreaImageHeightPixels: 20,
          CroppedAreaTopPixels: 6,
        }),
      ],
      ['a full panorama that is not 2:1', sphereGPano(64, 40)],
      ...[
        'CroppedAreaImageWidthPixels',
        'CroppedAreaImageHeightPixels',
        'CroppedAreaLeftPixels',
        'CroppedAreaTopPixels',
      ].map((name) => [
        `a missing ${name}`,
        sphereGPano(64, 32, { [name]: undefined }),
      ]),
      [
        'malformed dimensions',
        sphereGPano(64, 32, { FullPanoWidthPixels: '64px' }),
      ],
      [
        'missing full panorama dimensions',
        sphereGPano(64, 32, { FullPanoWidthPixels: undefined }),
      ],
    ];
    rejected.forEach(([name, properties]) => {
      it(`should not detect ${name}`, async () => {
        const defined = Object.fromEntries(
          Object.entries(properties).filter(([, v]) => v !== undefined)
        );
        const info = await infoOf({
          width: 64,
          height: 32,
          xmp: gpanoXmp(defined),
        });
        should(detectPanorama(info)).be.false();
      });
    });

    it('should not detect a sphere whose XMP packet is truncated', async () => {
      const truncated = gpanoXmp(sphereGPano(64, 32)).split('/>')[0];
      const info = await infoOf({ width: 64, height: 32, xmp: truncated });
      should(info.xmp).containEql('GPano:CroppedAreaTopPixels');
      should(detectPanorama(info)).be.false();
    });

    it('should not detect metadata inconsistent with the image dimensions', async () => {
      const info = await infoOf({
        width: 64,
        height: 48,
        xmp: gpanoXmp(sphereGPano(64, 32)),
      });
      should(detectPanorama(info)).be.false();
    });

    it('should not detect an unreadable or unsupported file', async () => {
      should(detectPanorama(null)).be.false();
      should(
        detectPanorama(
          await infoOf({
            width: 64,
            height: 32,
            format: 'tiff',
            xmp: gpanoXmp(sphereGPano(64, 32)),
          })
        )
      ).be.false();
    });
  });

  describe('checkManualPanorama()', () => {
    it('should accept a 2:1 still image without GPano metadata', async () => {
      should(
        checkManualPanorama(await infoOf({ width: 64, height: 32 }))
      ).be.null();
      should(
        checkManualPanorama(await infoOf({ width: 65, height: 32 }))
      ).be.null();
    });

    it('should accept an image whose viewer flag is false', async () => {
      const info = await infoOf({
        width: 64,
        height: 32,
        xmp: gpanoXmp(sphereGPano(64, 32, { UsePanoramaViewer: 'False' })),
      });
      should(checkManualPanorama(info)).be.null();
    });

    it('should reject dimensions that are not 2:1', async () => {
      should(
        checkManualPanorama(await infoOf({ width: 64, height: 48 }))
      ).equal(REASONS.NOT_A_COMPLETE_SPHERE);
    });

    it('should reject a known incompatible projection', async () => {
      const info = await infoOf({
        width: 64,
        height: 32,
        xmp: gpanoXmp({ ProjectionType: 'cylindrical' }),
      });
      should(checkManualPanorama(info)).equal(REASONS.UNSUPPORTED_PROJECTION);
    });

    it('should reject a known partial coverage', async () => {
      const info = await infoOf({
        width: 64,
        height: 32,
        xmp: gpanoXmp(
          sphereGPano(128, 64, {
            CroppedAreaImageWidthPixels: 64,
            CroppedAreaImageHeightPixels: 32,
            CroppedAreaLeftPixels: 32,
          })
        ),
      });
      should(checkManualPanorama(info)).equal(REASONS.PARTIAL_COVERAGE);
    });

    it('should accept GPano metadata that does not describe the coverage', async () => {
      const info = await infoOf({
        width: 64,
        height: 32,
        xmp: gpanoXmp({
          ProjectionType: 'equirectangular',
          FullPanoWidthPixels: 64,
          FullPanoHeightPixels: 32,
        }),
      });
      should(checkManualPanorama(info)).be.null();
    });

    const knownPartial = [
      [
        'nonzero offsets without full panorama dimensions',
        {
          ProjectionType: 'equirectangular',
          CroppedAreaLeftPixels: 32,
          CroppedAreaTopPixels: 16,
        },
      ],
      [
        'a nonzero offset next to a malformed full width',
        {
          ProjectionType: 'equirectangular',
          FullPanoWidthPixels: '128px',
          FullPanoHeightPixels: 64,
          CroppedAreaTopPixels: 16,
        },
      ],
      [
        'a cropped height smaller than the full height, the width missing',
        {
          ProjectionType: 'equirectangular',
          FullPanoHeightPixels: 64,
          CroppedAreaImageHeightPixels: 32,
        },
      ],
    ];
    knownPartial.forEach(([name, properties]) => {
      it(`should reject ${name}`, async () => {
        const info = await infoOf({
          width: 64,
          height: 32,
          xmp: gpanoXmp(properties),
        });
        should(checkManualPanorama(info)).equal(REASONS.PARTIAL_COVERAGE);
      });
    });

    it('should reject non-images and unsupported formats', async () => {
      should(checkManualPanorama(null)).equal(REASONS.NOT_AN_IMAGE);
      should(
        checkManualPanorama(
          await infoOf({ width: 64, height: 32, format: 'tiff' })
        )
      ).equal(REASONS.UNSUPPORTED_FORMAT);
    });
  });

  describe('readImageInfo()', () => {
    it('should return null for a file that is not an image', async () => {
      should(await readImageInfo(Buffer.from('%PDF-1.4'))).be.null();
      should(await readImageInfo(Buffer.alloc(0))).be.null();
      should(await readImageInfo(undefined)).be.null();
    });

    it('should read the format, dimensions and XMP of the original', async () => {
      const xmp = gpanoXmp({ ProjectionType: 'equirectangular' });
      const info = await infoOf({ width: 64, height: 32, xmp });
      should(info).containEql({
        format: 'jpeg',
        width: 64,
        height: 32,
        pages: 1,
      });
      should(info.xmp).containEql('equirectangular');
    });
  });
});
