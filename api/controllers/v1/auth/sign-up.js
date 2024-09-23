const AuthService = require('../../../services/AuthService');
const ElasticsearchService = require('../../../services/ElasticsearchService');
const CaverService = require('../../../services/CaverService');

const PASSWORD_MIN_LENGTH = 8;

module.exports = async (req, res) => {
  // Check params
  let email = req.param('email');
  if (!email || !CaverService.isARealCaver(email)) {
    return res.badRequest('You must provide an email.');
  }
  email = email.toLowerCase();
  const caverEmail = await TCaver.findOne({ mail: email });
  if (caverEmail) {
    return res.conflict(`The email ${email} is already used.`);
  }

  const password = req.param('password');
  if (!password) {
    return res.badRequest('You must provide a password.');
  }
  if (password && password.length < PASSWORD_MIN_LENGTH) {
    return res.badRequest(
      `Your password must be at least ${PASSWORD_MIN_LENGTH} characters long.`
    );
  }

  const nickname = req.param('nickname');
  if (!nickname) {
    return res.badRequest('You must provide a nickname.');
  }
  const caverNickname = await TCaver.findOne({ nickname });
  if (caverNickname) {
    return res.conflict(`The nickname ${nickname} is already used.`);
  }

  try {
    // Rely on the ORM for the rest of the input validation
    const newCaver = await TCaver.create({
      dateInscription: new Date(),
      language: '000', // default null language id
      mail: email,
      name: req.param('name') === '' ? null : req.param('name'),
      nickname,
      password: await AuthService.createHashedPassword(password),
      surname: req.param('surname') === '' ? null : req.param('surname'),
    }).fetch();

    ElasticsearchService.create('cavers', newCaver.id, {
      tags: ['caver'],
      id: newCaver.id,
      groups: '',
      mail: newCaver.mail,
      name: newCaver.name,
      nickname: newCaver.nickname,
      surname: newCaver.surname,
      deleted: false,
    });
  } catch (_) {
    return res.badRequest();
  }

  return res.ok();
};
