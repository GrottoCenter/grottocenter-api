const METADATA_STATUS = {
  REGISTERED: 'registered',
  DELETED: 'deleted',
};

module.exports = {
  /**
   * Get a bibliographic record by its ID
   * @param {string} id - the ID of the record to retrieve
   * @param {boolean} registeredOnly - if true, only return registered records; if false, return all records
   */
  async getMetadata(id, registeredOnly = true) {
    const criteria = { id };

    if (registeredOnly) {
      criteria.metadataStatus = METADATA_STATUS.REGISTERED;
    }

    const Record = await sails.models.tbibliographicmetadata.findOne(criteria);

    if (!Record) {
      return null;
    }

    return Record;
  },
};
