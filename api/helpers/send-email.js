/* eslint-disable no-underscore-dangle */
const { SendEmailCommand } = require('@aws-sdk/client-ses');
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
      },
    );

    // Create sendEmail params
    const params = {
      Destination: {
        CcAddresses: [],
        ToAddresses: [recipientEmail],
      },
      Message: {
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
      Source: allowResponse
        ? sails.config.custom.internalEmailAddress
        : sails.config.custom.fromEmailAddress,
      ReplyToAddresses: [],
    };

    if (await awsSesCli.areAwsCredentialsSet()) {
      const command = new SendEmailCommand(params);
      try {
        await awsSesCli.send(command);
        sails.log(`An email has been sent using AWS SES service.
          FROM: ${params.Source}
          TO: ${params.Destination.ToAddresses.join(',')}
          SUBJECT: ${params.Message.Subject.Data}
        `);
        return exits.success();
      } catch (error) {
        sails.log.error(error);
        return exits.sendSESEmailError();
      }
    } else {
      sails.log(
        `===== SEND EMAIL HELPER - DEBUG =====
You are seing this message because you didn't configure your AWS credentials locally. In production website, the following email would be sent using AWS SES service.
      
      FROM: ${params.Source}
      TO: ${params.Destination.ToAddresses.join(',')}
      SUBJECT: ${params.Message.Subject.Data}
      CONTENT:

${params.Message.Body.Html.Data}        
      `,
      );
      return exits.success();
    }
  },
};
