const https = require('https');
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
      file:
        'An object representing the downloaded file , including the attributes "buffer", "originalname", "size" & "mimetype" (like a multer object, see https://github.com/expressjs/multer#file-information).',
    },
    downloadError: {
      description:
        'An error occured when downloading the file located at the given url.',
      responseType: 'downloadError',
    },
    invalidUrl: {
      description: 'The url provided is not valid.',
      responseType: 'invalidUrl',
    },
    formatRefused: {
      description: 'The file format is in the refusedFileFormats list.',
      responseType: 'formatRefused',
    },
  },

  fn: async function(inputs, exits) {
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

    // Download it
    https
      .get(fileUrl, (res) => {
        const { acceptedFileFormats, refusedFileFormats } = inputs;
        const contentType = res.headers['content-type'];
        const extension = mime.extension(contentType);

        if (refusedFileFormats && refusedFileFormats.includes(extension)) {
          return exits.formatRefused(extension);
        }
        if (
          acceptedFileFormats !== undefined &&
          !acceptedFileFormats.includes(extension)
        ) {
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
              originalname: fileUrl.href.split('/').pop(),
              size: Buffer.byteLength(fileBuffer),
            });
          });
      })
      .on('error', (err) => {
        return exits.downloadError('download error:', err);
      });
  },
};
