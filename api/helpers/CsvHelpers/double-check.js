module.exports = {
  friendlyName: 'Usable value checker',

  description:
    "Returns the default value (undefined) if data doesn't contain the key, or if the value associated is an empty string. Else returns the value.",

  sync: true,

  inputs: {
    data: {
      type: 'ref',
      description: 'Object containing the data to check',
      required: true,
    },
    key: {
      type: 'string',
      description: 'The key which may or may not be present in data',
      required: true,
    },
    defaultValue: {
      type: 'ref',
      description: 'Default value if no value found.',
      required: false,
      defaultsTo: undefined,
    },
    func: {
      type: 'ref',
      description: 'Function applied to the returned value',
      required: false,
      defaultsTo: (v) => v,
    },
  },

  fn: function(inputs, exits) {
    const { data, key, defaultValue, func } = inputs;
    return exits.success(
      data[key] && data[key] !== '' ? func(data[key]) : defaultValue,
    );
  },
};
