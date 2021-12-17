module.exports = {
  friendlyName: 'Entity existence checker',

  description:
    "This helper doesn't perform any verification on your inputs, be careful when using it.",

  inputs: {
    attributeName: {
      type: 'string',
      description: 'Attribute to search for',
      example: 'id',
      required: true,
    },
    attributeValue: {
      type: 'ref',
      description: 'Value to search for',
      example: 12354,
      required: true,
    },
    sailsModel: {
      type: 'ref',
      description: 'Sails model to use',
      required: true,
    },
    additionalAttributes: {
      type: 'ref',
      description:
        'An additional Sails criteria (see https://sailsjs.com/documentation/concepts/models-and-orm/query-language)',
      required: false,
    },
  },

  exits: {
    success: {
      outputDescription:
        'A boolean set to true if there is at least one entity with the attributeName matching the attributeValue, otherwise false.',
    },
  },

  fn: async function(inputs, exits) {
    const {
      sailsModel,
      attributeName,
      attributeValue,
      additionalAttributes,
    } = inputs;
    const entityFound = await sailsModel.findOne({
      [attributeName]: attributeValue,
      ...additionalAttributes,
    });
    return exits.success(entityFound !== undefined);
  },
};
