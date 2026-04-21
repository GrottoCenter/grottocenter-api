const { SESv2Client } = require('@aws-sdk/client-sesv2');

const client = new SESv2Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
  region: process.env.AWS_REGION || 'eu-central-1',
});

client.areAwsCredentialsSet = async () => {
  const credentials = await client.config.credentials();
  return (
    credentials.accessKeyId !== undefined &&
    credentials.secretAccessKey !== undefined
  );
};

module.exports.awsSesCli = client;
