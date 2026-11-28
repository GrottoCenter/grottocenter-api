/**
 * Extract specific identifier from identifiers array
 * @param {Array} identifiers - Array of identifiers, each in the format "type:value"
 * @param {string} type - The type of identifier to extract (e.g., isbn, issn, url, ...)
 * @return {string|null} - The extracted identifier value or null if not found
 */
function extractIdentifier(identifiers, type) {
  if (!identifiers || !Array.isArray(identifiers)) return null;

  const identifier = identifiers.find((id) => id.startsWith(`${type}:`));
  return identifier ? identifier.replace(`${type}:`, '') : null;
}

/**
 * Format date for MARC
 * @param {string|Date} date - The date to format, can be a string or Date object
 * @returns {string} - The formatted date string in the format YYYYMMDDHHMM
 */
function formatDateForMarc(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return `${year}${month}${day}${hours}${minutes}${seconds}.0`;
}

/**
 * Get file format from URL
 * @param {string} url - The URL to extract the file format from
 */
function getFileFormat(url) {
  const extension = url.split('.').pop().toLowerCase();
  const formatMap = {
    pdf: 'application/pdf',
    xml: 'application/xml',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };

  return formatMap[extension] || null;
}

/** * Determine ISO 3166 country code format
 * @param {string} countryCode - The country code to check
 * @returns {number} - Returns 1 for 3-letter codes, 2 for longer codes, and 0 for shorter codes
 */
function determineIsoCode3166(countryCode) {
  if (countryCode.length === 3) {
    return 1;
  }
  if (countryCode.length > 3) {
    return 2;
  }

  return 0;
}
/**
 * Determine bibliographic level of the document according to UNIMARC standard
 * @param {string} type - The type of document (e.g., 'collection', 'article', 'book')
 * @returns {string} - Returns 's' for collection, 'a' for article, m for other
 */
function determineBibliographicLevel(type) {
  switch (type.toLowerCase()) {
    case 'collection':
      return 's';
    case 'article':
      return 'a';
    default:
      return 'm';
  }
}

/**
 * Determine document type according to UNIMARC standard
 * @param {Array} types - Array of document types from metadata
 * @param {Array} identifiers - Array of identifiers
 * @returns {string|null} - Returns UNIMARC document type code or null
 */
function determineTypeDocument(types) {
  if (!types || !Array.isArray(types) || types.length === 0) {
    return null;
  }

  const type = types[0].toLowerCase();
  switch (type) {
    case 'text':
    case 'article':
    case 'book':
    case 'report':
      return 'a'; // text

    case 'map':
    case 'topographic drawing':
    case 'topographic data':
      return 'e'; // document cartographic

    case 'moving image':
      return 'g'; // video

    case 'sound':
      return 'i'; // sound record no musical

    case 'image':
      return 'k'; // document graphic 2 dimension

    case 'interactive resource':
      return 'l'; // electronical support

    case 'dataset':
      return 'l'; // electronical support

    case 'collection':
    case 'issue':
    case 'physical object':
    case 'authorization to publish':
      return 'm'; // other

    default:
      break;
  }

  // if no specific type is found, default to 'a' (text)
  return 'a';
}

/**
 * Get type from listSets
 * @param {Array} listSets - Array of list sets from metadata
 * @returns {string|null} - Returns the type of the document or null if not found
 */
function getTypeWithListSets(listSets) {
  if (!listSets || !Array.isArray(listSets) || listSets.length <= 1) {
    return null;
  }

  return listSets[1].toLowerCase().replace('grottocenter:', '');
}

/**
 * Format a date as YYYYMMDD (local time, as the database timestamps are read)
 * @param {string|Date|null} date
 * @returns {string|null} - null when the date is missing or invalid
 */
function formatDateYYYYMMDD(date) {
  if (!date) return null;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

/**
 * Trim a text value and drop it when nothing is left
 * @param {*} value
 * @returns {string|null}
 */
function cleanText(value) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text === '' ? null : text;
}

/**
 * Keep only real ISO 639-2 language codes: `000` is the "undefined" row of
 * t_language, not a code a library system understands.
 * @param {Array<string>} languages
 * @returns {Array<string>}
 */
function cleanLanguages(languages) {
  if (!Array.isArray(languages)) return [];
  const codes = languages
    .map((l) => cleanText(l))
    .filter((l) => l && /^[a-zA-Z]{3}$/.test(l))
    .map((l) => l.toLowerCase());
  return [...new Set(codes)];
}

/**
 * Split a name written "SURNAME Forename" into its two parts.
 * Leading upper-case words are the surname, the rest is the forename.
 * @param {string} name
 * @returns {{surname: string, forename: string}|null} null when the name does not follow that pattern
 */
function splitName(name) {
  const tokens = (cleanText(name) || '').split(/\s+/);
  // An initial (`J.`, `E.-A.`, `J.P.`) is upper-case too, but it starts the
  // forename. Not `C.A.F.`: a longer dotted acronym is not an initial.
  const isInitial = (t) => /^\p{Lu}\.(-?\p{Lu}\.)?$/u.test(t);
  const isSurnameToken = (t) =>
    /\p{L}/u.test(t) && t === t.toUpperCase() && !isInitial(t);
  let i = 0;
  while (i < tokens.length && isSurnameToken(tokens[i])) i += 1;
  // The forename must look like one (`Serge`, `J.`), otherwise this is probably
  // an acronym or an organization (`CDS 74 Comité`, `GSM C.A.F.`).
  if (
    i === 0 ||
    i === tokens.length ||
    !(/^\p{Lu}\p{Ll}/u.test(tokens[i]) || isInitial(tokens[i]))
  )
    return null;
  return {
    surname: tokens.slice(0, i).join(' '),
    forename: tokens.slice(i).join(' '),
  };
}

module.exports = {
  formatDateYYYYMMDD,
  cleanText,
  cleanLanguages,
  splitName,
  extractIdentifier,
  formatDateForMarc,
  getFileFormat,
  determineIsoCode3166,
  determineBibliographicLevel,
  determineTypeDocument,
  getTypeWithListSets,
};
