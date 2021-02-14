const elasticsearch = require('elasticsearch');

let config;

if (['demo', 'dev-docker'].includes(process.env.NODE_ENV)) {
  config = {
    host: process.env.ES_HOST,
    log: 'trace',
  };
} else if (process.env.NODE_ENV === 'production') {
  config = {
    host: process.env.ES_HOST,
    log: 'error',
  };
} else {
  // In dev, when we don't use a container for the server. So we don't have access to elasticsearchgrotto.
  config = {
    host: 'localhost:9200',
    log: 'trace',
  };
}

module.exports.elasticsearchCli = new elasticsearch.Client(config);
