const should = require('should');

const { distantFileDownload } = require('../../../api/utils/csvHelper');

describe('DistantFileDownload helper', () => {
  it('should download the grottocenter logo', async () => {
    const file = await distantFileDownload({
      url: 'https://grottocenter.org/images/logo.svg',
      allowedExtentions: ['svg'],
    });
    should(file).not.be.empty();
    should(file).have.properties([
      'buffer',
      'mimetype',
      'originalname',
      'size',
    ]);
  });

  it('should raise an exception on invalid status', async () => {
    distantFileDownload({
      url: 'http://grottocenter.org/images/logo.svg', // Will redirect to HTTPS
      allowedExtentions: [],
    }).should.be.rejectedWith('Invalid response status');
  });

  it('should raise an exception on invalid protocol', async () => {
    distantFileDownload({
      url: 'ftp://grottocenter.org/images/logo.svg',
      allowedExtentions: [],
    }).should.be.rejectedWith('Invalid protocol');
  });

  it('should raise an exception on invalid url', async () => {
    distantFileDownload({
      url: 'an.invalid/url.pdf/mustraise/an/error',
      allowedExtentions: [],
    }).should.be.rejectedWith('Invalid URL');
  });

  it('should raise exceptions on refused (or not accepted) file formats', async () => {
    distantFileDownload({
      url: 'https://grottocenter.org/images/logo.svg',
      allowedExtentions: [],
    }).should.be.rejectedWith('Invalid file extention');

    distantFileDownload({
      url: 'https://grottocenter.org/images/logo.svg',
      allowedExtentions: ['pdf', 'txt'],
    }).should.be.rejectedWith('Invalid file extention');
  });
});
