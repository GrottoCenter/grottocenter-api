const should = require('should');
const ejs = require('ejs');
const path = require('path');

const TEMPLATES_DIR = path.resolve(__dirname, '../../../views/emailTemplates');

/**
 * Builds the view values required by the account notification templates,
 * matching what the send-email helper passes after merging viewValues with
 * locale-scoped helpers.
 */
const buildViewValues = (recipientName = 'TestCaver') => ({
  __: (str, ...args) => {
    // Simple sprintf-style replacement for %s
    let result = str;
    args.forEach((arg) => {
      result = result.replace('%s', arg);
    });
    return result;
  },
  locale: 'en',
  emailTitle: 'Grottocenter - Test Subject',
  recipientName,
});

describe('Account notification email templates', () => {
  describe('emailChanged.ejs', () => {
    it('should render without error when given valid view values', async () => {
      const viewValues = buildViewValues('Alice');
      const html = await ejs.renderFile(
        path.join(TEMPLATES_DIR, 'emailChanged.ejs'),
        viewValues
      );
      should(html).be.a.String();
      should(html.length).be.greaterThan(0);
    });

    it('should contain the recipient name in the rendered output', async () => {
      const viewValues = buildViewValues('Alice');
      const html = await ejs.renderFile(
        path.join(TEMPLATES_DIR, 'emailChanged.ejs'),
        viewValues
      );
      should(html).containEql('Alice');
    });

    it('should contain the email change notification message', async () => {
      const viewValues = buildViewValues('Alice');
      const html = await ejs.renderFile(
        path.join(TEMPLATES_DIR, 'emailChanged.ejs'),
        viewValues
      );
      should(html).containEql(
        'The email address associated with your Grottocenter account has been changed.'
      );
    });

    it('should contain the admin contact instruction', async () => {
      const viewValues = buildViewValues('Alice');
      const html = await ejs.renderFile(
        path.join(TEMPLATES_DIR, 'emailChanged.ejs'),
        viewValues
      );
      should(html).containEql(
        'If you did not make this change, please contact an administrator immediately at'
      );
      should(html).containEql(sails.config.custom.internalEmailAddress);
    });

    it('should NOT contain sensitive placeholders or data', async () => {
      const viewValues = buildViewValues('Alice');
      const html = await ejs.renderFile(
        path.join(TEMPLATES_DIR, 'emailChanged.ejs'),
        viewValues
      );
      // Must not contain password-related content
      should(html).not.containEql('password');
      should(html).not.containEql('Password');
      // Must not contain token references
      should(html).not.containEql('token');
      should(html).not.containEql('Token');
      // Must not contain new email address placeholder
      should(html).not.containEql('newEmail');
      should(html).not.containEql('new_email');
      should(html).not.containEql('new email');
    });
  });

  describe('passwordChanged.ejs', () => {
    it('should render without error when given valid view values', async () => {
      const viewValues = buildViewValues('Bob');
      const html = await ejs.renderFile(
        path.join(TEMPLATES_DIR, 'passwordChanged.ejs'),
        viewValues
      );
      should(html).be.a.String();
      should(html.length).be.greaterThan(0);
    });

    it('should contain the recipient name in the rendered output', async () => {
      const viewValues = buildViewValues('Bob');
      const html = await ejs.renderFile(
        path.join(TEMPLATES_DIR, 'passwordChanged.ejs'),
        viewValues
      );
      should(html).containEql('Bob');
    });

    it('should contain the password change notification message', async () => {
      const viewValues = buildViewValues('Bob');
      const html = await ejs.renderFile(
        path.join(TEMPLATES_DIR, 'passwordChanged.ejs'),
        viewValues
      );
      should(html).containEql(
        'The password for your Grottocenter account has been changed.'
      );
    });

    it('should contain the admin contact instruction', async () => {
      const viewValues = buildViewValues('Bob');
      const html = await ejs.renderFile(
        path.join(TEMPLATES_DIR, 'passwordChanged.ejs'),
        viewValues
      );
      should(html).containEql(
        'If you did not make this change, please contact an administrator immediately at'
      );
      should(html).containEql(sails.config.custom.internalEmailAddress);
    });

    it('should NOT contain sensitive placeholders or data', async () => {
      const viewValues = buildViewValues('Bob');
      const html = await ejs.renderFile(
        path.join(TEMPLATES_DIR, 'passwordChanged.ejs'),
        viewValues
      );
      // Must not contain actual password values or hash references
      should(html).not.containEql('hash');
      should(html).not.containEql('Hash');
      // Must not contain token references
      should(html).not.containEql('token');
      should(html).not.containEql('Token');
      // Must not contain session identifiers
      should(html).not.containEql('session');
      should(html).not.containEql('Session');
    });
  });
});
