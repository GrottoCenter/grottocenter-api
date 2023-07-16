const http = require('http');
const https = require('https');
// I don't know where mime-types comes from, it's not included in package.json...
// But it works.
// eslint-disable-next-line import/no-extraneous-dependencies
const mime = require('mime-types');

module.exports = {
  friendlyName: 'Distant file download helper',

  description: 'Try to download a distant file from an url',

  inputs: {
    url: {
      type: 'string',
      description: 'URL of the file',
      example: 'https://mysite.com/myfile.pdf',
      required: true,
    },
    acceptedFileFormats: {
      type: ['string'],
      description:
        'List of file formats accepted by the downloader (by looking at the Content-type header). If not provided, all formats are accepted.',
      example: ['pdf', 'word', 'txt'],
    },
    refusedFileFormats: {
      type: ['string'],
      description:
        'List of file formats refused by the downloader (by looking at the Content-type header). If not provided, no format is refused',
      example: ['pdf', 'word', 'txt'],
    },
  },

  exits: {
    success: {
      file: 'An object representing the downloaded file , including the attributes "buffer", "originalname", "size" & "mimetype" (like a multer object, see https://github.com/expressjs/multer#file-information).',
    },
    downloadError: {
      description:
        'An error occured when downloading the file located at the given url.',
    },
    invalidUrl: {
      description: 'The url provided is not valid.',
    },
    formatRefused: {
      description: 'The file format is in the refusedFileFormats list.',
    },
  },

  // eslint-disable-next-line consistent-return
  async fn(inputs, exits) {
    // Check if URL is valid
    let fileUrl;
    try {
      fileUrl = new URL(inputs.url);
    } catch (_) {
      return exits.invalidUrl();
    }

    if (fileUrl.protocol !== 'http:' && fileUrl.protocol !== 'https:') {
      return exits.invalidUrl();
    }

    const client = fileUrl.protocol === 'https:' ? https : http;

    // Download it
    client
      // eslint-disable-next-line consistent-return
      .get(fileUrl, (res) => {
        const { acceptedFileFormats, refusedFileFormats } = inputs;
        const contentType = res.headers['content-type'];
        const extension = mime.extension(contentType);

        if (refusedFileFormats && refusedFileFormats.includes(extension)) {
          res.socket.end();
          return exits.formatRefused(extension);
        }
        if (
          acceptedFileFormats !== undefined &&
          !acceptedFileFormats.includes(extension)
        ) {
          res.socket.end();
          return exits.formatRefused(extension);
        }

        const data = [];
        res
          .on('data', (chunk) => {
            data.push(chunk);
          })
          .on('end', () => {
            const fileBuffer = Buffer.concat(data);
            return exits.success({
              buffer: fileBuffer,
              mimetype: contentType,
              originalname: decodeURI(fileUrl.href.split('/').pop()),
              size: Buffer.byteLength(fileBuffer),
            });
          });
      })
      .on('error', (err) => exits.downloadError('download error:', err));
  },
};
