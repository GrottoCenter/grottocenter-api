const elasticsearch = require('elasticsearch');

let client = {};

if (process.env.NODE_ENV === 'production') {
  client = new elasticsearch.Client({
    host: process.env.ES_HOST,
    log: 'error',
  });
} else {
  client = new elasticsearch.Client({
    host: process.env.ES_HOST,
    log: 'trace',
  });
}

module.exports.elasticsearchCli = client;
