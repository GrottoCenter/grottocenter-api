const elasticsearch = require('elasticsearch');

module.exports.elasticsearchCli = new elasticsearch.Client({
  host: process.env.ES_HOST ?? 'localhost:9200',
  log: process.env.NODE_ENV === 'production' ? 'error' : 'warning',
});
