const Marc = require('../MarcRecord');
const {
  determineIsoCode3166,
  formatDateForMarc,
  extractIdentifier,
} = require('../Utils');

/**
 * Generate MARC21 leader
 * link : https://www.loc.gov/marc/bibliographic/bdleader.html
 * @param {string} type - The type of document (e.g., 'article', 'book')
 * @returns {string} - The MARC-21 leader string
 */
function generateLeader(type) {
  let leader = '00000';
  leader += 'n';

  switch (type) {
    case 'article':
      leader += 'a';
      break;
    case 'book':
      leader += 'a';
      break;
    case 'issue':
      leader += 'a';
      break;
    default:
      leader += 'a';
  }

  leader += 'm'; // monographic
  leader += ' '; // position 08
  leader += 'a'; // position 09
  leader += '2'; // 10
  leader += '2'; // 11
  leader += '00000'; // base address placeholder
  leader += ' '; // 17
  leader += 'i'; // 18
  leader += ' '; // 19
  leader += '4'; // 20
  leader += '5'; // 21
  leader += '0'; // 22
  leader += '0'; // 23

  return leader;
}

module.exports = {
  /**
   * Transform normalized document data to MARC 21 format
   * link : https://www.loc.gov/marc/bibliographic/
   * @param {Object} document - Document data from your notice format
   * @returns {Object} MARC 21 formatted data
   */
  transform: (document) => {
    const marcRecord = new Marc();

    const docType =
      document.dcTypes && document.dcTypes.length > 0
        ? document.dcTypes[0]
        : 'unknown';
    marcRecord.addLeader(generateLeader(docType));

    marcRecord
      .addControlField('001', document.id)
      .addControlField('005', formatDateForMarc(document.lastUpdate));

    if (document.dcTitle) {
      const titleField = [['a', document.dcTitle]];
      if (document.Responsability) {
        titleField.push(['f', document.Responsability]);
      }
      marcRecord.addDataField('245', '0', '0', titleField);
    }

    if (
      document.dcCreators &&
      document.dcCreators.length > 0 &&
      document.dcCreators[0] !== 'Unknown'
    ) {
      marcRecord.addDataField('100', ' ', ' ', [['a', document.dcCreators[0]]]);

      if (document.dcCreators.length > 1) {
        document.dcCreators.slice(1).forEach((creator) => {
          marcRecord.addDataField('700', ' ', ' ', [['a', creator]]);
        });
      }
    } else {
      marcRecord.addDataField('100', ' ', ' ', [['a', 'Unknown Author']]);
    }

    if (document.dcContributor && document.dcContributor !== 'Unknown') {
      marcRecord.addDataField('700', ' ', ' ', [['a', document.dcContributor]]);
    }

    if (document.dcPublisher && document.dcPublisher !== 'Unknown') {
      const publisherField = [['b', document.dcPublisher]];

      if (document.dcDate) {
        publisherField.push(['c', document.dcDate.getFullYear().toString()]);
      }

      marcRecord.addDataField('260', ' ', ' ', publisherField);
    }

    if (document.dcLanguages && document.dcLanguages.length > 0) {
      marcRecord.addDataField('041', '0', ' ', [
        ['a', document.dcLanguages[0]],
      ]);

      if (document.dcLanguages.length > 1) {
        document.dcLanguages.slice(1).forEach((lang) => {
          marcRecord.addDataField('041', '0', ' ', [['a', lang]]);
        });
      }
    }

    if (document.dcDescriptions && document.dcDescriptions.length > 0) {
      document.dcDescriptions.forEach((description) => {
        marcRecord.addDataField('520', ' ', ' ', [['a', description]]);
      });
    }

    if (document.dcCoverages && document.dcCoverages.length > 0) {
      document.dcCoverages.forEach((coverage) => {
        const isoCode = determineIsoCode3166(coverage);
        if (isoCode === 1) {
          marcRecord.addDataField('043', ' ', ' ', [['c', coverage]]);
        } else {
          marcRecord.addDataField('500', ' ', ' ', [['a', coverage]]);
        }
      });
    }

    if (document.dcSubjects && document.dcSubjects.length > 0) {
      document.dcSubjects.forEach((subject) => {
        marcRecord.addDataField('653', ' ', ' ', [['a', subject]]);
      });
    }

    if (document.dcFormats && document.dcFormats.length > 0) {
      document.dcFormats.forEach((format) => {
        if (format) {
          marcRecord.addDataField('856', ' ', ' ', [['q', format]]);
        }
      });
    }

    if (document.dcIdentifiers && document.dcIdentifiers.length > 0) {
      document.dcIdentifiers.forEach((identifier) => {
        const type = identifier.split(':')[0];
        const value = extractIdentifier(identifier, type);
        if (value) {
          switch (type) {
            case 'isbn':
              marcRecord.addDataField('020', ' ', ' ', [['a', value]]);
              break;
            case 'issn':
              marcRecord.addDataField('022', ' ', ' ', [['a', value]]);
              break;
            case 'ean':
              marcRecord.addDataField('024', '3', ' ', [['a', value]]);
              break;
            case 'url':
              marcRecord.addDataField('856', '4', '0', [['u', value]]);
              break;
            default:
              break;
          }
        }
      });
    }

    if (document.dcRelations && document.dcRelations.length > 0) {
      document.dcRelations.forEach((relation) => {
        marcRecord.addDataField('787', '0', ' ', [['n', relation]]);
      });
    }

    if (document.dcRights && document.dcRights.length > 0) {
      marcRecord.addDataField('540', ' ', ' ', [
        ['a', `Licence: ${document.dcRights.join(', ')}`],
      ]);
    }

    if (document.dcTypes && document.dcTypes.length > 0) {
      document.dcTypes.forEach((type) => {
        marcRecord.addDataField('655', ' ', '7', [['a', type]]);
      });
    }

    marcRecord.addDataField('040', ' ', ' ', [['a', 'GrottoCenterAgencyCode']]);
    marcRecord.addDataField('042', ' ', ' ', [['a', 'dc']]); // derivate of the dublin core format

    return marcRecord;
  },
};
