const { toListCaver } = require('../../../services/mapping/converters');
const RightService = require('../../../services/RightService');

module.exports = async (req, res) => {
  const hasRight = RightService.hasGroup(
    req.token.groups,
    RightService.G.ADMINISTRATOR
  );
  if (!hasRight) {
    return res.forbidden(
      'You are not authorized to list cavers with invalid email.'
    );
  }

  const caversWithInvalidEmail = await TCaver.find({ mailIsValid: false });

  return res.ok({ cavers: caversWithInvalidEmail.map(toListCaver) });
};
