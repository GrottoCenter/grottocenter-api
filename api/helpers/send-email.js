/* eslint-disable no-underscore-dangle */
const { SendEmailCommand } = require('@aws-sdk/client-sesv2');
const ejs = require('ejs');
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
    i18n: {
      type: 'ref',
      defaultsTo: sails.hooks.i18n,
      description: 'Locale module to use to translate the email content.',
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
      i18n,
      recipientEmail,
      viewName,
      viewValues,
    } = inputs;

    // TODO: set locale temporarily
    const emailHtml = await ejs.renderFile(
      `./views/emailTemplates/${viewName}.ejs`,
      {
        ...viewValues,
        i18n,
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
            Data: `Grottocenter - ${i18n.__(emailSubject)}`,
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
