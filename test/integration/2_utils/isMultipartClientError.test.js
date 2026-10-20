const should = require('should');
const { MulterError } = require('multer');
const isMultipartClientError = require('../../../api/utils/isMultipartClientError');

describe('isMultipartClientError', () => {
  it('accepts every MulterError', () => {
    ['LIMIT_FILE_SIZE', 'LIMIT_FILE_COUNT', 'LIMIT_UNEXPECTED_FILE'].forEach(
      (code) => {
        should(
          isMultipartClientError(new MulterError(code, 'files'))
        ).be.true();
      }
    );
  });

  it('accepts busboy parse errors', () => {
    [
      'Unexpected end of form',
      'Unexpected end of file',
      'Malformed part header',
      'Multipart: Boundary not found',
      'Malformed content type',
      'Malformed urlencoded form',
    ].forEach((message) => {
      should(isMultipartClientError(new Error(message))).be.true();
    });
  });

  it('rejects a client disconnect', () => {
    should(isMultipartClientError(new Error('Request aborted'))).be.false();
    should(isMultipartClientError(new Error('Request closed'))).be.false();
  });

  it('rejects any other error', () => {
    should(isMultipartClientError(new Error('ENOSPC'))).be.false();
    should(isMultipartClientError(new TypeError('boom'))).be.false();
  });

  it('rejects a non-error', () => {
    should(isMultipartClientError(undefined)).be.false();
    should(isMultipartClientError(null)).be.false();
    should(isMultipartClientError('Unexpected end of form')).be.false();
    should(
      isMultipartClientError({ name: 'MulterError', message: 'x' })
    ).be.false();
  });
});
