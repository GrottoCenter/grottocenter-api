const Marc = require('../MarcRecord');
const {
  determineIsoCode3166,
  getCurrentDateYYYYMMDD,
  formatDateForMarc,
  extractIdentifier,
  determineBibliographicLevel,
  determineTypeDocument,
} = require('../Utils');

/**
 * Generate UNIMARC leader
 * link : https://repository.ifla.org/server/api/core/bitstreams/f1aeb085-852e-4c1e-9683-7b08d5f1cde1/content
 * @param {string} type - The type of document (e.g., 'article', 'book')
 * @returns {string} - The UNIMARC leader string
 */
function generateLeader(type) {
  let leader = '00000'; // size of the document
  leader += 'n'; // status : new document

  leader += determineTypeDocument(type) || 'a'; // type of document
  leader += determineBibliographicLevel(type); // bibliographic level

  leader += ' ';
  leader += 'a';
  leader += '2'; // Unimarc code
  leader += '2'; // Unimarc code
  leader += '00000';
  leader += '   ';
  leader += '4';
  leader += '5';
  leader += '0';
  leader += '0';

  return leader;
}

module.exports = {
  /**
   * Transform normalized document data to UNIMARC format
   * link : https://repository.ifla.org/server/api/core/bitstreams/f1aeb085-852e-4c1e-9683-7b08d5f1cde1/content
   * @param {Object} document - Document data from your notice format
   * @returns {Object} UNIMARC formatted data
   */
  transform: async (document) => {
    const marcRecord = new Marc();

    marcRecord.addLeader(generateLeader(document.dcTypeGrottocenter));

    marcRecord
      .addControlField('001', document.id)
      .addControlField('005', formatDateForMarc(document.lastUpdate));

    if (document.dcTitle) {
      const titleField = [['a', document.dcTitle]];
      if (document.Responsability) {
        titleField.push(['f', document.Responsability]);
      }
      marcRecord.addDataField('200', ' ', ' ', titleField);
    }

    if (
      document.dcCreators &&
      document.dcCreators.length > 0 &&
      document.dcCreators[0] !== 'Unknown'
    ) {
      marcRecord.addDataField('700', ' ', ' ', [['a', document.dcCreators[0]]]); // Assuming first creator is the main author
      if (document.dcCreators.length > 1) {
        document.dcCreators.slice(1).forEach((creator) => {
          marcRecord.addDataField('701', ' ', ' ', [['a', creator]]); // Additional authors
        });
      }
    }

    if (document.dcContibutor) {
      marcRecord.addDataField('800', ' ', ' ', [['a', document.dcContibutor]]);
    }

    if (document.dcPublisher && document.dcPublisher !== 'Unknown') {
      marcRecord.addDataField('210', ' ', ' ', [['c', document.dcPublisher]]);
    }

    let field100 = getCurrentDateYYYYMMDD(); // Character 0-7
    field100 += document.dcDate
      ? `a${document.dcDate.getFullYear()}`
      : '         '; // Character 8-16
    field100 += '    a'; // Character 17-21
    field100 +=
      document.dcLanguages && document.dcLanguages > 0
        ? document.dcLanguages[0]
        : 'fre'; // Character 22-24
    field100 += 'y'; // Character 25
    field100 += '50      ba'; // Character 26-35
    marcRecord.addDataField('100', ' ', ' ', [['a', field100]]);

    if (document.dcLanguages && document.dcLanguages.length > 0) {
      document.dcLanguages.forEach((lang) => {
        marcRecord.addDataField('101', ' ', ' ', [['a', lang]]);
      });
    }

    if (document.dcDescriptions) {
      document.dcDescriptions.forEach((description) => {
        marcRecord.addDataField('330', ' ', ' ', [['a', description]]);
      });
    }

    if (document.dcSources) {
      document.dcSources.forEach((sources) => {
        marcRecord.addDataField('330', ' ', ' ', [
          ['a', `Source : ${sources}`],
        ]);
      });
    }

    if (document.dcCoverages && document.dcCoverages.length > 0) {
      document.dcCoverages.forEach((coverage) => {
        const isoCode = determineIsoCode3166(coverage);
        if (isoCode === 1) {
          marcRecord.addDataField('102', ' ', ' ', [['a', coverage]]); // ISO 3166-1
        } else if (isoCode === 2) {
          marcRecord.addDataField('102', ' ', ' ', [['c', coverage]]); // ISO 3166-2
        }
      });
    }

    if (document.dcSubjects && document.dcSubjects.length > 0) {
      document.dcSubjects.forEach((subject) => {
        marcRecord.addDataField('606', ' ', ' ', [['a', subject]]);
      });
    }

    if (document.dcFormats && document.dcFormats.length > 0) {
      document.dcFormats.forEach((format) => {
        if (format) {
          marcRecord.addDataField('856', ' ', ' ', [['q', format]]);
        }
      });
    }

    if (document.dcIdientifiers && document.dcIdentifiers.length > 0) {
      document.dcIdentifiers.forEach((identifier) => {
        const type = identifier.split(':')[0];
        const value = extractIdentifier(identifier, type);
        if (value) {
          switch (type) {
            case 'isbn':
              marcRecord.addDataField('010', ' ', ' ', [['a', value]]);
              break;
            case 'issn':
              marcRecord.addDataField('011', ' ', ' ', [['a', value]]);
              break;
            case 'ean':
              marcRecord.addDataField('073', ' ', ' ', [['a', value]]);
              break;
            case 'url':
              marcRecord.addDataField('856', ' ', ' ', [['u', value]]);
              break;
            default:
              break;
          }
        }
      });
    }

    for (const parent of document.parents) {
      marcRecord.addDataField('461', ' ', ' ', [
        ['0', parent.id.toString()],
        ['t', parent.dcTitle],
      ]);
    }

    if (document.dcRights) {
      marcRecord.addDataField('540', ' ', ' ', [
        ['a', `Licence :${document.dcRights}`],
      ]);
    }

    if (document.dcPages) {
      marcRecord.addDataField('215', ' ', ' ', [['a', document.dcPages]]);
    }

    if (document.dcTypeGrottocenter) {
      marcRecord.addDataField('183', ' ', ' ', [
        ['a', document.dcTypeGrottocenter],
      ]);
    }

    marcRecord.addDataField('801', ' ', ' ', [
      ['a', 'FR-740335301'],
      ['b', 'BERNEX-BBS/SA'],
    ]); // agency code

    if (document.otherField) {
      document.otherField.forEach((field) => {
        if (Array.isArray(field) && field.length > 0) {
          const tag = field[0];
          const subfields = field
            .slice(1)
            .map((subfield) =>
              Array.isArray(subfield) ? subfield : ['a', subfield]
            );
          marcRecord.addDataField(tag, ' ', ' ', subfields);
        }
      });
    }

    return marcRecord;
  },
};
