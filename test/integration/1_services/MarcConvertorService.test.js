const should = require('should');
const MarcConvertorService = require('../../../api/services/MarcConvertorService');

describe('MarcConvertorService', () => {
  describe('getSupportedCountries', () => {
    it('should return array of supported countries', () => {
      const countries = MarcConvertorService.getSupportedCountries();
      should(countries).be.an.Array();
      should(countries).containEql('default');
      should(countries).containEql('it');
    });
  });

  describe('getSupportedFormats', () => {
    it('should return array of supported formats', () => {
      const formats = MarcConvertorService.getSupportedFormats();
      should(formats).be.an.Array();
      should(formats).containEql('marc21');
      should(formats).containEql('unimarc');
    });
  });

  describe('documentToMarc', () => {
    it('should throw error for unsupported format', async () => {
      const document = { id: 1, title: 'Test' };
      try {
        await MarcConvertorService.documentToMarc(
          document,
          'invalid',
          'default'
        );
        should.fail('Should have thrown error');
      } catch (err) {
        should(err.message).containEql('Unsupported format');
      }
    });

    it('should use default country when country not provided', async () => {
      const document = { id: 1, dcTitle: 'Test Document' };
      const [, selectedCountry] = await MarcConvertorService.documentToMarc(
        document,
        'marc21'
      );
      should(selectedCountry).equal('default');
    });

    it('should use default country when unsupported country provided', async () => {
      const document = { id: 1, dcTitle: 'Test Document' };
      const [, selectedCountry] = await MarcConvertorService.documentToMarc(
        document,
        'marc21',
        'unsupported'
      );
      should(selectedCountry).equal('default');
    });
  });
});
