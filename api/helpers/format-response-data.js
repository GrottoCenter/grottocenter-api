module.exports = {
  friendlyName: 'Format response data',
  description: "Format data as JSON, casting data as json if it's a string.",
  sync: true,
  inputs: {
    data: {
      type: 'ref',
      description: 'Data to format (can be a JS object, a string or undefined)',
      example: { foo: 3, bar: true },
    },
  },

  exits: {
    success: {
      description: 'All done.',
    },
  },

  fn(inputs) {
    const { data } = inputs;
    if (typeof data === 'string') {
      return { message: data };
    }
    return data;
  },
};
