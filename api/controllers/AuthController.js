/**
 * AuthController
 *
 * @description :: Server-side logic for managing auths
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

const passport = require('passport');
const AuthService = require('../services/AuthService');
const ElasticsearchService = require('../services/ElasticsearchService');
const ErrorService = require('../services/ErrorService');
const TokenService = require('../services/TokenService');

const { tokenSalt } = AuthService;
const PASSWORD_MIN_LENGTH = 8;

module.exports = {
  login: (req, res) => {
    // eslint-disable-next-line consistent-return
    passport.authenticate('local', (err, user) => {
      if (!err && !user) {
        return res.unauthorized({ message: 'Invalid email or password.' });
      }
      if (err) {
        sails.log.error(`Error while trying to log in: ${err}`);
        return res
          .status(500)
          .send({ message: 'An internal server error occurred.' });
      }
      req.logIn(user, (loginErr) => {
        if (loginErr) return res.json({ message: loginErr });
        req.session.authenticated = true;
        const token = TokenService.issue(
          {
            id: user.id,
            groups: user.groups,
            nickname: user.nickname,
          },
          sails.config.custom.authTokenTTL,
          'Authentication',
          tokenSalt
        );
        return res.json({ token });
      });
    })(req, res);
  },

  logout: (req, res) =>
    res.badRequest('AuthController.logout not yet implemented!'), // req.session.authenticated = false;
  // return res.json(200, {"Logout succeeded"});

  signUp: async (req, res) => {
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
      return res
        .status(409)
        .send(`The email ${req.param('email')} is already used.`);
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
      return res
        .status(409)
        .send(`The nickname ${req.param('nickname')} is already used.`);
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

      return res.sendStatus(204);
    } catch (e) {
      ErrorService.getDefaultErrorHandler(res)(e);
      return false;
    }
  },
};
