const Marc = require('../MarcRecord');
const {
  determineIsoCode3166,
  formatDateForMarc,
  formatDateYYYYMMDD,
  extractIdentifier,
  cleanText,
  cleanLanguages,
  splitName,
} = require('../Utils');

// MARC21 leader/06, which is not the UNIMARC table: everything else
// (article, book, issue, collection, ...) is language material.
const LEADER_TYPE_OF_RECORD = {
  map: 'e',
  'topographic drawing': 'e',
  'topographic data': 'e',
  'moving image': 'g',
  sound: 'i',
  image: 'k',
  dataset: 'm',
  'interactive resource': 'm',
  'physical object': 'r',
};

const LEADER_BIBLIOGRAPHIC_LEVEL = {
  article: 'a', // monographic component part
  collection: 'c',
};

/** Leader/06 for a Grottocenter document type. */
function getTypeOfRecord(type) {
  const normalizedType = (type || '').replace(/_/g, ' ').toLowerCase();
  return LEADER_TYPE_OF_RECORD[normalizedType] || 'a';
}

/**
 * Generate MARC21 leader
 * link : https://www.loc.gov/marc/bibliographic/bdleader.html
 * @param {string} type - The Grottocenter type of the document (e.g., 'article', 'book')
 * @returns {string} - The MARC-21 leader string
 */
function generateLeader(type) {
  const normalizedType = (type || '').replace(/_/g, ' ');

  let leader = '00000';
  leader += 'n'; // 05 status: new
  leader += getTypeOfRecord(type); // 06 type of record
  leader += LEADER_BIBLIOGRAPHIC_LEVEL[normalizedType.toLowerCase()] || 'm'; // 07 bibliographic level
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

/**
 * Generate the MARC21 008 field (40 characters, books layout)
 * link : https://www.loc.gov/marc/bibliographic/bd008a.html
 * @param {Object} document - Document data
 * @returns {string}
 */
function generate008(document) {
  const entered = formatDateYYYYMMDD(
    document.creationDate || document.lastUpdate
  );
  const year = document.dcDate
    ? String(new Date(document.dcDate).getFullYear())
    : null;
  const languages = cleanLanguages(document.dcLanguages);

  let field = entered ? entered.slice(2) : '000000'; // 00-05 date entered on file
  field += year && /^\d{4}$/.test(year) ? `s${year}    ` : 'nuuuuuuuu'; // 06 type of date, 07-10 date 1, 11-14 date 2
  field += 'xx '; // 15-17 place of publication: unknown
  if (getTypeOfRecord(document.dcTypeGrottocenter) === 'a') {
    // books layout
    field += '    '; // 18-21 illustrations
    field += '       '; // 22-28 audience, form, nature, government publication
    field += '00'; // 29-30 conference, festschrift
    field += '0'; // 31 index
    field += ' '; // 32 undefined
    field += '|'; // 33 literary form: no attempt to code
    field += ' '; // 34 biography
  } else {
    // maps, visual materials, sounds...: other layouts, no meaning asserted
    field += '|'.repeat(17); // 18-34
  }
  field += languages[0] || 'und'; // 35-37 language
  field += ' '; // 38 modified record
  field += 'd'; // 39 cataloging source: other
  return field;
}

/**
 * Add a name field, with the indicators matching how the name is written.
 * @param {Object} marcRecord
 * @param {string} tag - 100 or 700
 * @param {string} name
 */
function addNameField(marcRecord, tag, name) {
  const parts = splitName(name);
  if (parts) {
    // ind1 = 1: surname entry
    marcRecord.addDataField(tag, '1', ' ', [
      ['a', `${parts.surname}, ${parts.forename}`],
    ]);
  } else {
    // ind1 = 0: forename (or a name that cannot be inverted)
    marcRecord.addDataField(tag, '0', ' ', [['a', cleanText(name)]]);
  }
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

    marcRecord.addLeader(generateLeader(document.dcTypeGrottocenter));

    marcRecord
      .addControlField('001', document.id)
      .addControlField('005', formatDateForMarc(document.lastUpdate))
      .addControlField('008', generate008(document));

    if (cleanText(document.dcTitle)) {
      const titleField = [['a', cleanText(document.dcTitle)]];
      if (cleanText(document.Responsability)) {
        titleField.push(['f', cleanText(document.Responsability)]);
      }
      // ind1 = 1: a 100 is always written, so the title has an added entry
      marcRecord.addDataField('245', '1', '0', titleField);
    }

    if (
      document.dcCreators &&
      document.dcCreators.length > 0 &&
      document.dcCreators[0] !== 'Unknown'
    ) {
      addNameField(marcRecord, '100', document.dcCreators[0]);

      if (document.dcCreators.length > 1) {
        document.dcCreators.slice(1).forEach((creator) => {
          addNameField(marcRecord, '700', creator);
        });
      }
    } else {
      marcRecord.addDataField('100', '0', ' ', [['a', 'Unknown Author']]);
    }

    if (
      cleanText(document.dcContributor) &&
      document.dcContributor !== 'Unknown'
    ) {
      addNameField(marcRecord, '700', document.dcContributor);
    }

    const publisher = cleanText(document.dcPublisher);
    const publicationYear = document.dcDate
      ? new Date(document.dcDate).getFullYear()
      : null;
    const publicationSubfields = [];
    if (publisher && publisher !== 'Unknown') {
      publicationSubfields.push(['b', publisher]);
    }
    if (Number.isInteger(publicationYear)) {
      publicationSubfields.push(['c', publicationYear.toString()]);
    }
    if (publicationSubfields.length > 0) {
      marcRecord.addDataField('260', ' ', ' ', publicationSubfields);
    }

    // 041 only when a language is known; `und` and `000` are not language codes
    const languages = cleanLanguages(document.dcLanguages);
    if (languages.length > 0) {
      marcRecord.addDataField(
        '041',
        '0',
        ' ',
        languages.map((lang) => ['a', lang])
      );
    }

    if (document.dcDescriptions && document.dcDescriptions.length > 0) {
      document.dcDescriptions.forEach((description) => {
        if (cleanText(description)) {
          marcRecord.addDataField('520', ' ', ' ', [
            ['a', cleanText(description)],
          ]);
        }
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
        if (cleanText(subject)) {
          marcRecord.addDataField('653', ' ', ' ', [['a', cleanText(subject)]]);
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

    if (document.landingPageUrl) {
      marcRecord.addDataField('856', '4', '0', [
        ['u', document.landingPageUrl],
        ['y', 'Grottocenter'],
      ]);
    }

    const licenceSubfields = [];
    if (document.dcRights && document.dcRights.length > 0) {
      licenceSubfields.push(['a', `Licence: ${document.dcRights.join(', ')}`]);
    }
    if (document.dcLicenseUrl) {
      licenceSubfields.push(['u', document.dcLicenseUrl]);
    }
    if (licenceSubfields.length > 0) {
      marcRecord.addDataField('540', ' ', ' ', licenceSubfields);
    }

    if (document.dcTypeGrottocenter) {
      marcRecord.addDataField('655', ' ', '7', [
        ['a', document.dcTypeGrottocenter],
      ]);
    }

    // No 040: Grottocenter has no MARC organization code, and a placeholder
    // would be imported as the cataloguing agency.
    marcRecord.addDataField('042', ' ', ' ', [['a', 'dc']]); // derivate of the dublin core format

    return marcRecord;
  },
};
