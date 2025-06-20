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

/**
 * Get current date in YYYYMMDD format
 */
function getCurrentDateYYYYMMDD() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}${month}${day}`;
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

module.exports = {
  extractIdentifier,
  formatDateForMarc,
  getFileFormat,
  getCurrentDateYYYYMMDD,
  determineIsoCode3166,
};
