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
  },

  exits: {
    success: {
      outputDescription:
        'A boolean set to true if there is at least one entity with the attributeName matching the attributeValue, otherwise false.',
    },
  },

  fn: async function(inputs, exits) {
    const { sailsModel, attributeName, attributeValue } = inputs;
    const entityFound = await sailsModel.findOne({
      [attributeName]: attributeValue,
    });
    return exits.success(entityFound !== undefined);
  },
};
