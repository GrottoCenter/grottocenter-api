/**
 * AuthController
 *
 * @description :: Server-side logic for managing auths
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

const passport = require('passport');
const esClient = require('../../config/elasticsearch').elasticsearchCli;
const PASSWORD_MIN_LENGTH = 8;

module.exports = {
  login: (req, res) => {
    passport.authenticate('local', (err, user, info) => {
      if (!err && !user) {
        return res.unauthorized({ message: 'Invalid email or password.' });
      }
      if (err) {
        sails.log.error('Error while trying to log in: ' + err);
        return res
          .status(500)
          .send({ message: 'An internal server error occurred.' });
      }
      req.logIn(user, (err) => {
        if (err) return res.json({ message: err });
        req.session.authenticated = true;
        const token = TokenService.issue(
          {
            id: user.id,
            groups: user.groups,
            nickname: user.nickname,
          },
          24 * 90, // Expires after 90 days
        );
        return res.json({ token });
      });
    })(req, res);
  },

  logout: (req, res) => {
    return res.badRequest('AuthController.logout not yet implemented!');
    // req.session.authenticated = false;
    // return res.json(200, {"Logout succeeded"});
  },

  signUp: async (req, res) => {
    // Check params
    if (!req.param('email')) {
      return res.badRequest(`You must provide an email.`);
    }
    if (await CaverService.checkIfExists('mail', req.param('email'))) {
      return res
        .status(409)
        .send(`The email ${req.param('email')} is already used.`);
    }
    if (!req.param('password')) {
      return res.badRequest(`You must provide a password.`);
    }
    if (
      req.param('password') &&
      req.param('password').length < PASSWORD_MIN_LENGTH
    ) {
      return res.badRequest(
        'Your password must be at least ' +
          PASSWORD_MIN_LENGTH +
          ' characters long.',
      );
    }
    if (!req.param('nickname')) {
      return res.badRequest(`You must provide a nickname.`);
    }
    if (await CaverService.checkIfExists('nickname', req.param('nickname'))) {
      return res
        .status(409)
        .send(`The nickname ${req.param('nickname')} is already used.`);
    }

    // Create caver
    const newCaver = await TCaver.create({
      dateInscription: new Date(),
      language: '000', // default null language id
      mail: req.param('email'),
      name: req.param('name') === '' ? null : req.param('name'),
      nickname: req.param('nickname'),
      password: AuthService.createHashedPassword(req.param('password')),
      surname: req.param('surname') === '' ? null : req.param('surname'),
    })
      .fetch()
      .intercept('E_UNIQUE', () => res.sendStatus(409))
      .intercept('UsageError', (e) => res.badRequest(e.cause.message))
      .intercept('AdapterError', (e) => res.badRequest(e.cause.message))
      .intercept((e) => res.serverError(e.message));

    const userGroup = await TGroup.findOne({ name: 'User' });
    await TCaver.addToCollection(newCaver.id, 'groups', userGroup.id);

    try {
      esClient.create({
        index: `cavers-index`,
        type: 'data',
        id: newCaver.id,
        body: {
          id: newCaver.id,
          groups: String(userGroup.id),
          mail: newCaver.mail,
          name: newCaver.name,
          nickname: newCaver.nickname,
          surname: newCaver.surname,
          type: 'caver',
        },
      });
    } catch (error) {
      sails.log.error(error);
    }

    return res.sendStatus(204);
  },

  forgotPassword: async (req, res) => {
    const emailProvided = req.param('email');
    if (!emailProvided) {
      return res.badRequest(`You must provide an email.`);
    }

    // Get info about the user
    const userFound = await TCaver.findOne({ mail: emailProvided });
    if (!userFound) {
      return res.status(404).send({
        message: 'Caver with email ' + emailProvided + ' not found.',
      });
    }

    // Generate reset password token
    const token = TokenService.issue(
      {
        action: 'Reset password',
        userId: userFound.id,
      },
      24, // Expires after 1 day (24h)
    );

    const result = await sails.helpers.sendEmail
      .with({
        emailSubject: 'Grottocenter - Password Reset',
        recipientEmail: emailProvided,
        viewName: 'forgotPassword',
        viewValues: {
          recipientName: userFound.nickname,
          resetLink:
            'https://beta.grottocenter.org/ui/changePassword?token=' + token,
        },
      })
      .intercept('sendSESEmailError', () => {
        return res.serverError(
          'The email service has encountered an error. Please try again later or contact Wikicaves for more information.',
        );
      });
    return res.sendStatus(204);
  },

  changePassword: async (req, res) => {
    // Check params
    const password = req.param('password');
    const token = req.param('token');
    if (!password) {
      return res.badRequest(`You must provide a password.`);
    }
    if (password.length < PASSWORD_MIN_LENGTH) {
      return res.badRequest(
        'Your password must be at least ' +
          PASSWORD_MIN_LENGTH +
          ' characters long.',
      );
    }
    if (!token) {
      return res.badRequest(`You must provide a reset password token.`);
    }

    // Check token
    TokenService.verify(token, async (err, decodedToken) => {
      if (err && err.name === 'TokenExpiredError') {
        return res.forbidden('The password reset token has expired.');
      }
      if (decodedToken.action !== 'Reset password') {
        return res.forbidden('The password reset token action is invalid.');
      }
      // Update password request
      const updatedCaver = await TCaver.updateOne({
        id: decodedToken.userId,
      }).set({
        password: AuthService.createHashedPassword(password),
      });

      if (!updatedCaver) {
        return res.status(404).send({
          message: 'User with id ' + decodedToken.userId + ' not found.',
        });
      }
      return res.sendStatus(204);
    });
  },
};
