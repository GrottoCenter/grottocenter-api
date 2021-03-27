const { SESClient } = require('@aws-sdk/client-ses');
const client = new SESClient({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
  region: process.env.AWS_REGION || 'eu-central-1',
  ses: '2010-12-01',
});

client.areAwsCredentialsSet = async () => {
  const credentials = await client.config.credentials();
  return (
    credentials.accessKeyId !== undefined &&
    credentials.secretAccessKey !== undefined
  );
};

module.exports.awsSesCli = client;
