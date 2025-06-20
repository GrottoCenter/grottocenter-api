const { MarcRecord } = require('@natlibfi/marc-record');
const { ISO2709 } = require('@natlibfi/marc-record-serializers');

/**
 * Class representing a MARC record.
 * This class provides methods to create and manipulate MARC records using @natlibfi/marc-record
 */
class Marc {
  constructor() {
    this.record = new MarcRecord();
  }

  /**
   * Adds a data field to the MARC record.
   * @param {string} tag - The tag of the data field.
   * @param {string} ind1 - The first indicator of the data field.
   * @param {string} ind2 - The second indicator of the data field.
   * @param {Array} subfields - An array of subfields, where each subfield is an array containing the subfield code and value.
   */
  addDataField(tag, ind1, ind2, subfields) {
    const subfieldObjects = subfields.map((sf) => ({
      code: sf[0],
      value: sf[1],
    }));

    const field = {
      tag,
      ind1,
      ind2,
      subfields: subfieldObjects,
    };

    this.record.insertField(field);
    return this;
  }

  /**
   * Adds a control field to the MARC record.
   * @param {string} tag - The tag of the control field.
   * @param {string} value - The value of the control field.
   */
  addControlField(tag, value) {
    const field = {
      tag,
      value: value.toString(),
    };

    this.record.insertField(field);
    return this;
  }

  /**
   * Sets the leader of the MARC record.
   * @param {string} leader - The leader string to be set.
   */
  addLeader(leader) {
    this.record.leader = leader;
    return this;
  }

  /**
   * Gets the MARC record.
   * @returns {MarcRecord} The MARC record object.
   */
  getRecord() {
    return this.record;
  }

  /**
   * Clears the current MARC record, resetting it to a new empty record.
   */
  clear() {
    this.record = new MarcRecord();
    return this;
  }

  /**
   * Returns a string representation of the MARC record.
   * @return {string} The string representation of the MARC record.
   */
  toString() {
    return this.record.toString();
  }

  /**
   * Calculates the current length of the MARC record.
   * @returns {number} The total length of the MARC record when serialized
   */
  getCurrentLength() {
    try {
      const iso2709String = ISO2709.to(this.record);
      return iso2709String.length;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Transforms the MARC record to ISO2709 format.
   * @returns {Promise<string>} A promise that resolves to the ISO2709 formatted string.
   */
  transformDocumentToIso2709() {
    return new Promise((resolve, reject) => {
      try {
        const iso2709String = ISO2709.to(this.record);
        resolve(iso2709String);
      } catch (error) {
        reject(new Error(`Failed to convert to ISO2709: ${error.message}`));
      }
    });
  }

  /**
   * Transforms the MARC record to ISO2709 format (synchronous version).
   * @returns {string} The ISO2709 formatted string.
   */
  toIso2709() {
    return ISO2709.to(this.record);
  }

  /**
   * Finds fields by tag.
   * @param {string} tag - The tag to search for.
   * @returns {Array} Array of fields matching the tag.
   */
  getFieldsByTag(tag) {
    return this.record.get(tag);
  }

  /**
   * Validates the MARC record.
   * @returns {boolean} True if the record is valid, false otherwise.
   */
  isValid() {
    try {
      // Try to serialize to check validity
      ISO2709.to(this.record);
      return true;
    } catch (error) {
      return false;
    }
  }
}

module.exports = Marc;
