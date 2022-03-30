const CaverService = require('../../services/CaverService');

module.exports = {
  friendlyName: 'Creator getter',

  description:
    'Get the the author object if it already exists. Else create one.',

  inputs: {
    creator: {
      type: 'string',
      description:
        'The string representing the author. Might be a link or not.',
      required: true,
    },
  },

  exits: {
    success: {
      outputDescription: 'The creator object.',
    },
  },

  async fn(inputs, exits) {
    const creatorNicknameRaw = await sails.helpers.csvhelpers.retrieveFromLink.with(
      { stringArg: inputs.creator },
    );
    const creatorNickname = creatorNicknameRaw.replace('_', ' ');
    const caversArray = await TCaver.find({
      nickname: creatorNickname,
    }).limit(1);
    let caver;
    if (caversArray.length === 0) {
      const [
        fullName,
        creatorName,
        creatorSurname,
      ] = await sails.helpers.csvhelpers.getPersonData.with({
        fullName: creatorNickname,
      });
      const paramsCaver = {
        name: creatorName,
        surname: creatorSurname,
        nickname: fullName,
      };
      caver = await CaverService.createNonUserCaver(
        paramsCaver,
        (error) => error,
      );
    } else {
      caver = caversArray[0];
    }

    return exits.success(caver);
  },
};
