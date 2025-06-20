const defaultConvertor = require('./marcConvertor/country/Default');
const ItConvertor = require('./marcConvertor/country/It');
const Marc21Convertor = require('./marcConvertor/format/Marc21');
const UnimarcConvertor = require('./marcConvertor/format/Unimarc');

const MarcCountryTransformers = {
  default: defaultConvertor,
  it: ItConvertor,
};

const MarcFormatTransformers = {
  marc21: Marc21Convertor,
  unimarc: UnimarcConvertor,
};

module.exports = {
  /**
   * Converts a document to MARC format based on the specified format and country.
   * @param {Object} document - The document to convert (OAI Metadata).
   * @param {string} format - The MARC format to convert to (e.g., 'marc21', 'unimarc').
   * @param {string} country - The country code for the MARC transformation (e.g., 'it', 'default').
   * @return {Promise<string>} - A promise that resolves to the MARC record in ISO 2709 format.
   */
  documentToMarc: async (document, format, country) => {
    if (!MarcFormatTransformers[format]) {
      throw new Error(`Unsupported format: ${format}`);
    }

    // verify if country exist, if not exist take the default controller
    let selectedCountry = country || 'default';
    if (!MarcCountryTransformers[selectedCountry]) {
      selectedCountry = 'default';
    }

    const marcCountryModule = MarcCountryTransformers[selectedCountry];
    const marcFormatModule = MarcFormatTransformers[format];

    // Normalize the document using the country-specific transformer
    const normalizedData = await marcCountryModule.normalizeMarc(document);

    // Convert the normalized data to MARC using the specified format transformer
    const marcData = await marcFormatModule.transform(normalizedData);

    // Convert the data to ISO 2709 format
    const record = await marcData.transformDocumentToIso2709();
    return [record, selectedCountry];
  },

  /**
   * Returns the list of supported countries for MARC transformations.
   * @return {Array<string>} - An array of country codes supported for MARC transformations
   */
  getSupportedCountries: () => Object.keys(MarcCountryTransformers),

  /**
   * Returns the list of supported formats for MARC transformations.
   * @return {Array<string>} - An array of format names supported for MARC transformations
   */
  getSupportedFormats: () => Object.keys(MarcFormatTransformers),
};
