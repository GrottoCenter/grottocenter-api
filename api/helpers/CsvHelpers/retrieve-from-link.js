module.exports = {
  description:
    'Retrieve the useful data out of a link, or return the the string as it is if it is not a link.',

  inputs: {
    stringArg: {
      type: 'string',
      description: 'The string',
      required: true,
    },
  },

  async fn(inputs, exits) {
    const string = inputs.stringArg.trim();
    return exits.success(
      string.startsWith('http') ? string.split('#')[1] : string,
    );
  },
};
