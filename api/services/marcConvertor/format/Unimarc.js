const Marc = require('../MarcRecord');
const {
  determineIsoCode3166,
  formatDateYYYYMMDD,
  cleanText,
  cleanLanguages,
  splitName,
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

/**
 * Add a 7XX name field, with the second indicator matching how the name is
 * written (1: entered under the surname, 0: under the forename).
 */
function addNameField(marcRecord, tag, name) {
  const parts = splitName(name);
  if (parts) {
    marcRecord.addDataField(tag, ' ', '1', [
      ['a', parts.surname],
      ['b', parts.forename],
    ]);
  } else {
    marcRecord.addDataField(tag, ' ', '0', [['a', cleanText(name)]]);
  }
}

/**
 * Generate the UNIMARC 100 $a general processing data (36 characters)
 * The date of entry is the creation date of the record, so it does not change
 * from one fetch to the next.
 */
function generate100(document) {
  const entered =
    formatDateYYYYMMDD(document.creationDate || document.lastUpdate) ||
    '        ';
  const year = document.dcDate ? new Date(document.dcDate).getFullYear() : null;
  const hasYear = Number.isInteger(year);

  let field = entered; // 0-7 date entered on file
  field += hasYear ? `d${year}    ` : 'u        '; // 8 type of date, 9-12 date 1, 13-16 date 2
  field += '   '; // 17-19 target audience
  field += 'y'; // 20 government publication: not
  field += '0'; // 21 modified record: not
  field += 'fre'; // 22-24 cataloguing language
  field += 'y'; // 25 transliteration: none
  field += '50      ba'; // 26-35 character sets (UTF-8), script of title (Latin)
  return field;
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

    if (cleanText(document.dcTitle)) {
      const titleField = [['a', cleanText(document.dcTitle)]];
      if (cleanText(document.Responsability)) {
        titleField.push(['f', cleanText(document.Responsability)]);
      }
      marcRecord.addDataField('200', ' ', ' ', titleField);
    }

    if (
      document.dcCreators &&
      document.dcCreators.length > 0 &&
      document.dcCreators[0] !== 'Unknown'
    ) {
      addNameField(marcRecord, '700', document.dcCreators[0]); // Assuming first creator is the main author
      if (document.dcCreators.length > 1) {
        document.dcCreators.slice(1).forEach((creator) => {
          addNameField(marcRecord, '701', creator); // Additional authors
        });
      }
    }

    if (document.dcContibutor) {
      marcRecord.addDataField('800', ' ', ' ', [['a', document.dcContibutor]]);
    }

    if (document.dcPublisher && document.dcPublisher !== 'Unknown') {
      marcRecord.addDataField('210', ' ', ' ', [['c', document.dcPublisher]]);
    }

    marcRecord.addDataField('100', ' ', ' ', [['a', generate100(document)]]);

    // 101 only when a language is known; `000` is not a language code
    cleanLanguages(document.dcLanguages).forEach((lang) => {
      marcRecord.addDataField('101', ' ', ' ', [['a', lang]]);
    });

    if (document.dcDescriptions) {
      document.dcDescriptions.forEach((description) => {
        if (cleanText(description)) {
          marcRecord.addDataField('330', ' ', ' ', [
            ['a', cleanText(description)],
          ]);
        }
      });
    }

    if (document.dcSources) {
      document.dcSources.forEach((sources) => {
        if (!cleanText(sources)) return;
        marcRecord.addDataField('330', ' ', ' ', [
          ['a', `Source : ${cleanText(sources)}`],
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
        if (cleanText(subject)) {
          marcRecord.addDataField('606', ' ', ' ', [['a', cleanText(subject)]]);
        }
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

    if (document.landingPageUrl) {
      marcRecord.addDataField('856', ' ', ' ', [
        ['u', document.landingPageUrl],
        ['z', 'Grottocenter'],
      ]);
    }

    const licenceSubfields = [];
    if (document.dcRights) {
      licenceSubfields.push(['a', `Licence :${document.dcRights}`]);
    }
    if (document.dcLicenseUrl) {
      licenceSubfields.push(['u', document.dcLicenseUrl]);
    }
    if (licenceSubfields.length > 0) {
      marcRecord.addDataField('540', ' ', ' ', licenceSubfields);
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
