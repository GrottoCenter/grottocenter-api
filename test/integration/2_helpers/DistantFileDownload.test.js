let should = require('should');

describe('DistantFileDownload helper', () => {
  it('should download the grottocenter logo', async () => {
    const result = await sails.helpers.distantFileDownload.with({
      url: 'https://beta.grottocenter.org/images/logo.svg',
    });
    should(result).not.be.empty();
    should(result).have.properties([
      'buffer',
      'mimetype',
      'originalname',
      'size',
    ]);
  });

  it('should raise exceptions on refused (or not accepted) file formats', async () => {
    await sails.helpers.distantFileDownload
      .with({
        url: 'https://beta.grottocenter.org/images/logo.svg',
        refusedFileFormats: ['svg'],
      })
      .should.be.rejectedWith({
        name: 'Exception',
        code: 'formatRefused',
      });
    await sails.helpers.distantFileDownload
      .with({
        url: 'https://beta.grottocenter.org/images/logo.svg',
        acceptedFileFormats: ['pdf', 'txt'],
      })
      .should.be.rejectedWith({
        name: 'Exception',
        code: 'formatRefused',
      });
  });

  it('should raise an exception on invalid url', async () => {
    await sails.helpers.distantFileDownload
      .with({
        url: 'an.invalid/url.pdf/mustraise/an/error',
      })
      .should.be.rejectedWith({
        name: 'Exception',
        code: 'invalidUrl',
      });
  });
});
