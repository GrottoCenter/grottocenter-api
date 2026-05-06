const ControllerService = require('../../../services/ControllerService');

module.exports = async (req, res) => {
  const caver = await TCaver.findOne({ id: req.token.id });

  if (!caver) {
    return res.notFound({
      message: `Caver with id ${req.token.id} not found.`,
    });
  }

  const data = {
    id: caver.id,
    nickname: caver.nickname,
    name: caver.name,
    surname: caver.surname,
    mail: caver.mail,
    language: caver.language,
    mailIsValid: caver.mailIsValid,
    sendNotificationByEmail: caver.sendNotificationByEmail,
  };

  const params = { controllerMethod: 'AccountController.find' };
  return ControllerService.treat(req, null, data, params, res);
};
