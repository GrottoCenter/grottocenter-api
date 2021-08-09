module.exports = {
  friendlyName: 'Missing columns checker',
  description: 'Check if the provided object contains the mandatory values.',

  inputs: {
    data: {
      type: 'ref',
      description: 'The object which has to be checked.',
      required: true,
    },
    additionalColumns: {
      type: 'ref',
      description: 'An array of columns to check as well.',
      required: false,
    },
  },

  exits: {
    success: {
      outputDescription: 'An array containing the missing columns (if any).',
    },
  },

  fn: async function(inputs, exits) {
    const { data, additionalColumns } = inputs;
    let requiredColumns = [
      'id',
      'rdf:type',
      'dct:rights/cc:attributionName',
      'dct:rights/karstlink:licenseType',
      'gn:countryCode',
    ];
    const requiredLocationColumns = [
      'karstlink:hasAccessDocument/dct:description',
      'karstlink:hasAccessDocument/dc:language',
      'karstlink:hasAccessDocument/dct:creator',
    ];
    const requiredDescriptionColumns = [
      'karstlink:hasDescriptionDocument/dct:title',
      'karstlink:hasDescriptionDocument/dct:creator',
      'karstlink:hasDescriptionDocument/dc:language',
    ];

    if (additionalColumns) {
      requiredColumns = requiredColumns.concat(additionalColumns);
    }

    const missingColumns = [];
    const doubleCheck = sails.helpers.csvhelpers.doubleCheck.with;

    for (const requiredColumn of requiredColumns) {
      if (
        !doubleCheck({ data: data, key: requiredColumn, defaultValue: false })
      ) {
        missingColumns.push(requiredColumn);
      }
    }
    if (
      doubleCheck({
        data: data,
        key: 'karstlink:hasDescriptionDocument/dct:title',
        defaultValue: false,
      })
    ) {
      for (const requiredDescColumn of requiredDescriptionColumns) {
        if (
          !doubleCheck({
            data: data,
            key: requiredDescColumn,
            defaultValue: false,
          })
        ) {
          missingColumns.push(requiredDescColumn);
        }
      }
    }
    if (
      doubleCheck({
        data: data,
        key: 'karstlink:hasAccessDocument/dct:description',
        defaultValue: false,
      })
    ) {
      for (const requiredLocColumn of requiredLocationColumns) {
        if (
          !doubleCheck({
            data: data,
            key: requiredLocColumn,
            defaultValue: false,
          })
        ) {
          missingColumns.push(requiredLocColumn);
        }
      }
    }

    return exits.success(missingColumns);
  },
};
