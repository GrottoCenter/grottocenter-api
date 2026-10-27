const should = require('should');
const {
  MAX_PDF_PAGE_OFFSET,
  parsePdfPageOffset,
  isPdfUrl,
  isPdfFileName,
  isPdfFileFormat,
} = require('../../../api/utils/pdfPageOffset');

describe('pdfPageOffset', () => {
  describe('parsePdfPageOffset()', () => {
    it('treats an omitted offset as unchanged', () => {
      should(parsePdfPageOffset(undefined, 'offset')).deepEqual({
        value: undefined,
      });
    });

    it('treats null and an empty multipart value as a clear', () => {
      should(parsePdfPageOffset(null, 'offset')).deepEqual({ value: null });
      should(parsePdfPageOffset('', 'offset')).deepEqual({ value: null });
    });

    it('keeps zero as a configured offset', () => {
      should(parsePdfPageOffset(0, 'offset')).deepEqual({ value: 0 });
      should(parsePdfPageOffset('0', 'offset')).deepEqual({ value: 0 });
      should(Object.is(parsePdfPageOffset('-0', 'offset').value, 0)).be.true();
    });

    it('accepts signed integers and integer strings', () => {
      should(parsePdfPageOffset(1, 'offset').value).equal(1);
      should(parsePdfPageOffset('-126', 'offset').value).equal(-126);
      should(parsePdfPageOffset('+3', 'offset').value).equal(3);
      should(parsePdfPageOffset(' 7 ', 'offset').value).equal(7);
    });

    it('accepts both bounds', () => {
      should(parsePdfPageOffset(MAX_PDF_PAGE_OFFSET, 'offset').value).equal(
        MAX_PDF_PAGE_OFFSET
      );
      should(
        parsePdfPageOffset(String(-MAX_PDF_PAGE_OFFSET), 'offset').value
      ).equal(-MAX_PDF_PAGE_OFFSET);
    });

    [
      ['a fractional number', 1.5],
      ['a fractional string', '1.5'],
      ['an exponent string', '1e3'],
      ['a malformed string', 'abc'],
      ['a blank string', '   '],
      ['an out-of-range value', MAX_PDF_PAGE_OFFSET + 1],
      ['an out-of-range negative string', '-2147483648'],
      ['NaN', NaN],
      ['Infinity', Infinity],
      ['a boolean', true],
      ['a repeated multipart field', ['1', '2']],
      ['an object', { value: 1 }],
    ].forEach(([label, raw]) => {
      it(`rejects ${label} and names the field`, () => {
        const result = parsePdfPageOffset(raw, 'identifierPdfPageOffset');
        should(result).have.property('error');
        should(result.error).containEql('identifierPdfPageOffset');
      });
    });
  });

  describe('isPdfUrl()', () => {
    it('recognizes a PDF path, ignoring the query, the fragment and the case', () => {
      should(isPdfUrl('https://example.org/bulletin.pdf')).be.true();
      should(
        isPdfUrl('https://example.org/Bulletin.PDF?dl=1#page=3')
      ).be.true();
    });

    it('rejects other URLs and non-URLs', () => {
      should(isPdfUrl('https://example.org/bulletin.html')).be.false();
      should(isPdfUrl('https://example.org/view?file=bulletin.pdf')).be.false();
      should(isPdfUrl('bulletin.pdf')).be.false();
      should(isPdfUrl(null)).be.false();
    });
  });

  describe('isPdfFileName()', () => {
    it('checks the extension', () => {
      should(isPdfFileName('bulletin.pdf')).be.true();
      should(isPdfFileName('BULLETIN.PDF')).be.true();
      should(isPdfFileName('video.mp4')).be.false();
      should(isPdfFileName('pdf')).be.false();
      should(isPdfFileName(undefined)).be.false();
    });
  });

  describe('isPdfFileFormat()', () => {
    it('checks the MIME type of a file format row', () => {
      should(isPdfFileFormat({ mimeType: 'application/pdf' })).be.true();
      should(isPdfFileFormat({ mimeType: 'application/pdf   ' })).be.true();
      should(isPdfFileFormat({ mimeType: 'video/mp4' })).be.false();
      should(isPdfFileFormat(42)).be.false();
      should(isPdfFileFormat(undefined)).be.false();
    });
  });
});
