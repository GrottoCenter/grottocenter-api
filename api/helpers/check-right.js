module.exports = {
  friendlyName: 'Rights helper',

  description:
    'Know if an user has the right to perform an action in Grottocenter, according to its right groups.',

  inputs: {
    groups: {
      type: 'ref',
      description: 'Collection of the user groups to test',
      example: [1, 3],
      required: true,
    },
    rightEntity: {
      type: 'string',
      description: 'Entity mentionned in the database right entry',
      example: 'Bibliography, Massif, Cave, Caver...',
      required: true,
    },
    rightAction: {
      type: 'string',
      description: 'Action to perform on the entity',
      example: 'edit, view, delete...',
      required: true,
    },
  },

  exits: {
    success: {
      outputDescription:
        'A boolean set to true if the user has the right, otherwise false.',
    },
    rightNotFound: {
      description:
        "The rightEntity and rightAction didn't match an existing right",
    },
  },

  fn: async function(inputs, exits) {
    TRight.findOne()
      .where({
        name: inputs.rightEntity + ' - ' + inputs.rightAction,
      })
      .populate('groups')
      .exec((err, rightFound) => {
        if (err) {
          sails.log.error(err.message);
          return exits.success(false);
        }
        if (!rightFound) {
          throw exits.rightNotFound();
        }

        for (let i = 0; i < inputs.groups.length; i++) {
          if (
            rightFound.groups.some(
              (rightGroup) => rightGroup.id === inputs.groups[i].id,
            )
          ) {
            return exits.success(true);
          }
        }

        return exits.success(false);
      });
  },
};
