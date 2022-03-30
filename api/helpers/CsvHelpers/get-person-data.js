module.exports = {
  friendlyName: 'Name, nickname and full name getter.',

  description:
    'Split the full name of a person into 2 values : his first name and last name (as much as possible).',

  inputs: {
    fullName: {
      type: 'string',
      description: 'The full name.',
      required: true,
    },
  },

  exits: {
    success: {
      outputDescription:
        'An array of 3 values containing the full name, the first name and the last name.',
    },
  },

  async fn(inputs, exits) {
    const { fullName } = inputs;
    const creatorArray = fullName.split(' ');
    if (creatorArray.length <= 3) {
      const creatorName = creatorArray[0];
      let creatorSurname = '';
      for (let i = 1; i < creatorArray.length; i += 1) {
        creatorSurname += `${creatorArray[i]} `;
      }
      creatorSurname = creatorSurname.slice(0, -1);
      return exits.success([fullName, creatorName, creatorSurname]);
    }
    return exits.success([fullName, undefined, undefined]);
  },
};
