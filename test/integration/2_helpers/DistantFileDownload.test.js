let should = require('should');

describe('DistantFileDownload helper', () => {
  it('should download the grottocenter logo', async () => {
    const resultHttp = await sails.helpers.distantFileDownload.with({
      url: 'http://beta.grottocenter.org/images/logo.svg',
    });
    const resultHttps = await sails.helpers.distantFileDownload.with({
      url: 'https://beta.grottocenter.org/images/logo.svg',
    });
    should(resultHttp).not.be.empty();
    should(resultHttp).have.properties([
      'buffer',
      'mimetype',
      'originalname',
      'size',
    ]);
    should(resultHttps).not.be.empty();
    should(resultHttps).have.properties([
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
