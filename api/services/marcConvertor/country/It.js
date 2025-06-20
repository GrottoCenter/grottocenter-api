module.exports = {
  /**
   * Transform normalized document data to MARC format for Italy
   * @param {Object} document - Document data from your notice format
   * @returns {Object} Normalized document data for MARC conversion
   */
  normalizeMarc: async (document) => {
    const newBibliographicMetadata = document;

    if (
      document.dcCreators &&
      document.dcCreators.length > 0 &&
      document.dcCreators[0] !== 'Unknown'
    ) {
      newBibliographicMetadata.Responsability = document.dcCreators[0];
    } else if (document.dcPublisher && document.dcPublisher !== 'Unknown') {
      newBibliographicMetadata.Responsability = `edited by ${document.dcPublisher}`;
    }

    return newBibliographicMetadata;
  },
};
