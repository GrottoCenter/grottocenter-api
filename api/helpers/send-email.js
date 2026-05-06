/* eslint-disable no-underscore-dangle */
const path = require('path');
const { SendEmailCommand } = require('@aws-sdk/client-sesv2');
const ejs = require('ejs');
const I18n = require('i18n-2');
const { awsSesCli } = require('../../config/awsSes');

module.exports = {
  friendlyName: 'Grottocenter single email sender',

  description:
    'This is the Grottocenter single email sender. If you have AWS Access & Secret keys, it will try to send the email using the SES service of Grottocenter. Otherwise, it will just log the email content in your console.',

  inputs: {
    allowResponse: {
      type: 'boolean',
      description:
        'Allow the recipient to respond to the email, using one grottocenter email or another.',
      defaultsTo: false,
      required: false,
    },
    emailSubject: {
      type: 'string',
      description: 'Email subject',
      example: 'Welcome to Grottocenter!',
      required: true,
    },
    locale: {
      type: 'string',
      description:
        'ISO 639-1 locale code (e.g. "fr", "en") to use for the email.',
      defaultsTo: sails.config.i18n.defaultLocale,
    },
    recipientEmail: {
      type: 'string',
      description: 'Recipient of the email',
      example: 'alice@gmail.com',
      isEmail: true,
      required: true,
    },
    viewName: {
      type: 'string',
      description:
        'Name of the view in views/emailTemplates folder, without .ejs suffix',
      example: 'forgotPassword',
      required: true,
    },
    viewValues: {
      type: 'ref',
      description: 'Data used in the views/templateEmails .ejs file',
      example: {
        recipientName: 'Alice',
        link1: 'https://mysite.com',
      },
      required: false,
    },
  },

  exits: {
    success: {
      description: 'All done.',
    },
    sendSESEmailError: {
      description:
        'An error occured when trying to send the email using SES service.',
    },
  },

  async fn(inputs, exits) {
    const {
      allowResponse,
      emailSubject,
      locale,
      recipientEmail,
      viewName,
      viewValues,
    } = inputs;

    // Create a fresh i18n instance scoped to this email's locale.
    // Each email gets its own instance — no shared mutable state.
    const i18n = new I18n({
      locales: sails.config.i18n.locales,
      defaultLocale: sails.config.i18n.defaultLocale,
      directory: path.resolve(
        sails.config.appPath,
        sails.config.i18n.localesDirectory || 'config/locales'
      ),
      extension: '.json',
      devMode: process.env.NODE_ENV === 'development',
    });
    i18n.setLocale(locale);

    const __ = (...args) => i18n.__(...args);

    const subjectText = `Grottocenter - ${__(emailSubject)}`;

    const emailHtml = await ejs.renderFile(
      `./views/emailTemplates/${viewName}.ejs`,
      {
        ...viewValues,
        __,
        locale,
        emailTitle: subjectText,
      }
    );

    // Create sendEmail params (SES v2 structure)
    const params = {
      Destination: {
        CcAddresses: [],
        ToAddresses: [recipientEmail],
      },
      Content: {
        Simple: {
          Body: {
            Html: {
              Charset: 'UTF-8',
              Data: emailHtml,
            },
            Text: {
              Charset: 'UTF-8',
              Data: '',
            },
          },
          Subject: {
            Charset: 'UTF-8',
            Data: subjectText,
          },
        },
      },
      FromEmailAddress: allowResponse
        ? sails.config.custom.internalEmailAddress
        : sails.config.custom.fromEmailAddress,
      // ReplyToAddresses intentionally omitted — SES v2 defaults to no
      // reply-to header, matching the previous v1 behaviour (explicit []).
    };

    if (await awsSesCli.areAwsCredentialsSet()) {
      const command = new SendEmailCommand(params);
      try {
        await awsSesCli.send(command);
        sails.log.info(`An email has been sent using AWS SES service.
          FROM: ${params.FromEmailAddress}
          TO: ${params.Destination.ToAddresses.join(',')}
          SUBJECT: ${params.Content.Simple.Subject.Data}
        `);
        return exits.success();
      } catch (error) {
        sails.log.error(error);
        return exits.sendSESEmailError();
      }
    } else {
      sails.log.info(
        `===== SEND EMAIL HELPER - DEBUG =====
You are seing this message because you didn't configure your AWS credentials locally. In production website, the following email would be sent using AWS SES service.

      FROM: ${params.FromEmailAddress}
      TO: ${params.Destination.ToAddresses.join(',')}
      SUBJECT: ${params.Content.Simple.Subject.Data}
      CONTENT:

${params.Content.Simple.Body.Html.Data}
      `
      );
      return exits.success();
    }
  },
};
