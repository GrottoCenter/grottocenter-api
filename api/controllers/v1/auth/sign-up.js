const AuthService = require('../../../services/AuthService');
const ElasticsearchService = require('../../../services/ElasticsearchService');
const ErrorService = require('../../../services/ErrorService');

const PASSWORD_MIN_LENGTH = 8;

module.exports = async (req, res) => {
  // Check params
  if (!req.param('email')) {
    return res.badRequest('You must provide an email.');
  }
  if (
    await sails.helpers.checkIfExists.with({
      attributeName: 'mail',
      attributeValue: req.param('email'),
      sailsModel: TCaver,
    })
  ) {
    return res.conflict(`The email ${req.param('email')} is already used.`);
  }
  if (!req.param('password')) {
    return res.badRequest('You must provide a password.');
  }
  if (
    req.param('password') &&
    req.param('password').length < PASSWORD_MIN_LENGTH
  ) {
    return res.badRequest(
      `Your password must be at least ${PASSWORD_MIN_LENGTH} characters long.`
    );
  }
  if (!req.param('nickname')) {
    return res.badRequest('You must provide a nickname.');
  }
  if (
    await sails.helpers.checkIfExists.with({
      attributeName: 'nickname',
      attributeValue: req.param('nickname'),
      sailsModel: TCaver,
    })
  ) {
    return res.conflict(
      `The nickname ${req.param('nickname')} is already used.`
    );
  }

  // Create caver
  try {
    const newCaver = await TCaver.create({
      dateInscription: new Date(),
      language: '000', // default null language id
      mail: req.param('email'),
      name: req.param('name') === '' ? null : req.param('name'),
      nickname: req.param('nickname'),
      password: AuthService.createHashedPassword(req.param('password')),
      surname: req.param('surname') === '' ? null : req.param('surname'),
    }).fetch();
    const userGroup = await TGroup.findOne({ name: 'User' });
    await TCaver.addToCollection(newCaver.id, 'groups', userGroup.id);

    ElasticsearchService.create('cavers', newCaver.id, {
      tags: ['caver'],
      id: newCaver.id,
      groups: String(userGroup.id),
      mail: newCaver.mail,
      name: newCaver.name,
      nickname: newCaver.nickname,
      surname: newCaver.surname,
    });

    return res.ok();
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
