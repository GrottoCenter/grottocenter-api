const elasticsearch = require('elasticsearch');
//TODO: Change the url to 'elasticsearchgrotto:9200' for dockerization
const client = new elasticsearch.Client({
  host: 'localhost:9200',
  log: 'trace'
});

module.exports.elasticsearchCli = client;