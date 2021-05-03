const entranceValidator = {
  id: {
    type: 'string',
    required: true,
    accepted: '',
  },
  'rdf:type': {
    type: 'string',
    required: true,
    accepted: '',
  },
  'dct:rights/cc:attributionName': {
    type: 'string',
    required: true,
    accepted: '',
  },
  'dct:rights/karstlink:licenceType': {
    type: 'string',
    required: true,
    accepted: '',
  },
  'dct:rights/dct:created': {
    type: 'date',
    required: false,
    accepted: '',
  },
  'dct:rights/dct:modified': {
    type: 'date',
    required: false,
    accepted: '',
  },
  'dct:rights/cc:attributionURL': {
    type: 'string',
    required: true,
    accepted: '',
  },
  'rdfs:label': {
    type: 'string',
    required: true,
    accepted: '',
  },
  'gn:alternateName': {
    type: 'string',
    required: false,
    accepted: '',
  },
  'schema:containedInPlace': {
    type: 'string',
    required: false,
    accepted: '',
  },
  'w3geo:latitude': {
    type: 'float',
    required: true,
    accepted: '',
  },
  'w3geo:longitude': {
    type: 'float',
    required: true,
    accepted: '',
  },
  'w3geo:altitude': {
    type: 'int',
    required: false,
    accepted: '',
  },
  'dwc:coordinatePrecision': {
    type: 'int',
    required: false,
    accepted: '',
  },
  'karstlink:length': {
    type: 'int',
    required: false,
    accepted: '',
  },
  'karstlink:verticalExtend': {
    type: 'int',
    required: false,
    accepted: '',
  },
  'karstlink:extendBelowEntrance': {
    type: 'int',
    required: false,
    accepted: '',
  },
  'karstlink:extendAboveEntrance': {
    type: 'int',
    required: false,
    accepted: '',
  },
  'gn:countryCode': {
    type: 'string',
    required: true,
    accepted: '',
  },
  'karstlink:discoveredBy': {
    type: 'string',
    required: true,
    accepted: '',
  },
  'karstlink:hasAccessDocument/dct:creator': {
    type: 'string',
    required: false,
    accepted: '',
  },
  'karstlink:hasAccessDocument/dc:language': {
    type: 'string',
    required: true,
    accepted: '',
  },
  'karstlink:hasAccessDocument/dct:title': {
    type: 'string',
    required: true,
    accepted: '',
  },
  'karstlink:hasAccessDocument/dct:description': {
    type: 'string',
    required: false,
    accepted: '',
  },
  'karstlink:hasDescriptionDocument/dct:creator': {
    type: 'string',
    required: false,
    accepted: '',
  },
  'karstlink:hasDescriptionDocument/dc:language': {
    type: 'string',
    required: false,
    accepted: '',
  },
  'karstlink:hasDescriptionDocument/dct:title': {
    type: 'string',
    required: false,
    accepted: '',
  },
  'karstlink:hasDescriptionDocument/dct:description': {
    type: 'string',
    required: false,
    accepted: '',
  },
};

const documentValidator = {
  id: {
    type: 'string',
    required: true,
    accepted: '',
  },
  'rdf:type': {
    type: 'string',
    required: true,
    accepted: '',
  },
  'dct:rights/cc:attributionName': {
    type: 'string',
    required: true,
    accepted: '',
  },
  'dct:rights/karstlink:licenceType': {
    type: 'string',
    required: true,
    accepted: '',
  },
  'dct:rights/dct:created': {
    type: 'date',
    required: false,
    accepted: '',
  },
  'dct:rights/dct:modified': {
    type: 'date',
    required: false,
    accepted: '',
  },
  'dct:rights/cc:attributionURL': {
    type: 'string',
    required: true,
    accepted: '',
  },
  'karstlink:documentType': {
    type: 'string',
    required: false,
    accepted: '',
  },
  'rdfs:label': {
    type: 'string',
    required: true,
    accepted: '',
  },
  'dct:subject': {
    type: 'string',
    required: false,
    accepted: '',
  },
  'dc:language': {
    type: 'string',
    required: false,
    accepted: '',
  },
  'gn:countryCode': {
    type: 'string',
    required: false,
    accepted: '',
  },
  'dct:date': {
    type: 'date',
    required: false,
    accepted: '',
  },
  'dct:format': {
    type: 'string',
    required: false,
    accepted: '',
  },
  'dct:identifier': {
    type: 'string',
    required: false,
    accepted: '',
  },
  'dct:source': {
    type: 'string',
    required: false,
    accepted: '',
  },
  'dct:creator': {
    type: 'string',
    required: false,
    accepted: '',
  },
  'dct:publisher': {
    type: 'string',
    required: false,
    accepted: '',
  },
  'dct:isPartOf': {
    type: 'string',
    required: false,
    accepted: '',
  },
  'dct:references': {
    type: 'string',
    required: false,
    accepted: '',
  },
  'karstlink:relatedToUndergroundCavity': {
    type: 'string',
    required: false,
    accepted: '',
  },
  'karstlink:hasDescriptionDocument/dct:creator': {
    type: 'string',
    required: false,
    accepted: '',
  },
  'karstlink:hasDescriptionDocument/dc:language': {
    type: 'string',
    required: false,
    accepted: '',
  },
  'karstlink:hasDescriptionDocument/dct:title': {
    type: 'string',
    required: false,
    accepted: '',
  },
  'karstlink:hasDescriptionDocument/dct:description': {
    type: 'string',
    required: false,
    accepted: '',
  },
};

const errorsDictionary = {
  DATE_BEFORE_CREATED: 'the modification date is earlier than the creation date',
  DATE_IN_FUTURE: 'the date entered is later than the current date',
  DELIMITER_ERROR: 'DELIMITER_ERROR',
  FIELD_NULL: 'field is not filled',
  DATE_IN_FUTURE: 'the date entered is later than the current date',
  DATE_BEFORE_CREATED:
    'the modification date is earlier than the creation date',
  INVALID_DATE_FORMAT: 'date format is not respected, try with yyyy-mm-dd',
  INVALID_HEADER: 'INVALID_HEADER',
};

const dateChecker = (date) => {
  if (typeof date !== 'string') return null;

  const regEx = new RegExp(
    /([12][0-9]{3})-(0[13578]|1[02])-(0[1-9]|[12][0-9]|3[01])|([12][0-9]{3}-(0[469]|11)-(0[1-9]|[12][0-9]|30))|([12][0-9]{3})-(02)-(0[1-9]|1[0-9]|2[0-8])|(([12][0-9](04|08|[2468][048]|[13579][26]))|2000)-(02)-29/,
  );

  return regEx.test(date);
};

export { entranceValidator, documentValidator, errorsDictionary, dateChecker };
