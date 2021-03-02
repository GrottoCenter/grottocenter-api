const { awsSesCli } = require('../../config/awsSes');
const { SendEmailCommand } = require('@aws-sdk/client-ses');
const ejs = require('ejs');

const NO_RESPONSE_GROTTOCENTER_EMAIL =
  process.env.NO_RESPONSE_GROTTOCENTER_EMAIL ||
  'Grottocenter <underground_bot@grottocenter.org>';
const GROTTOCENTER_EMAIL =
  process.env.GROTTOCENTER_EMAIL || 'Grottocenter <info@grottocenter.org>';

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

  fn: async function(inputs, exits) {
    const {
      allowResponse,
      recipientEmail,
      emailSubject,
      viewName,
      viewValues,
    } = inputs;
    const emailHtml = await ejs.renderFile(
      './views/emailTemplates/' + viewName + '.ejs',
      viewValues,
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
          Data: emailSubject,
        },
      },
      Source: allowResponse
        ? GROTTOCENTER_EMAIL
        : NO_RESPONSE_GROTTOCENTER_EMAIL,
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
