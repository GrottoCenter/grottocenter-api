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
      responseType: 'rightNotFound',
    },
  },

  fn: async function(inputs, exits) {
    TRight.findOne()
      .where({
        and: [
          {
            name: {
              contains: inputs.rightEntity,
            },
          },
          {
            name: {
              contains: inputs.rightAction,
            },
          },
        ],
      })
      .populate('groups')
      .exec((err, rightFound) => {
        if (!rightFound) {
          throw exits.rightNotFound();
        }

        let isAllowed = false;
        inputs.groups.map((userGroup) => {
          if (
            rightFound.groups.some(
              (rightGroup) => rightGroup.id === userGroup.id,
            )
          ) {
            isAllowed = true;
          }
        });

        if (isAllowed) {
          return exits.success(true);
        } else {
          return exits.success(false);
        }
      });
  },
};
