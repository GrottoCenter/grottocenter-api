const Typesense = require('typesense');

const client = new Typesense.Client({
  nodes: [{ url: process.env.TYPESENSE_HOST ?? 'http://localhost:8108' }],
  apiKey: process.env.TYPESENSE_API_KEY ?? 'localhost_typesense_api_key',
  numRetries: 3, // A total of 4 tries (1 original try + 3 retries)
  connectionTimeoutSeconds: 120,
  // logLevel: "debug",
});

// Used only by the health check: a single short attempt, so a hung Typesense
// fails the probe quickly instead of riding out the retries above.
const healthClient = new Typesense.Client({
  nodes: [{ url: process.env.TYPESENSE_HOST ?? 'http://localhost:8108' }],
  apiKey: process.env.TYPESENSE_API_KEY ?? 'localhost_typesense_api_key',
  numRetries: 0,
  connectionTimeoutSeconds: 5,
});

async function isAlive() {
  const rep = await healthClient.health.retrieve();
  return rep?.ok === true;
}

async function isPopulated() {
  const rep = await client
    .aliases()
    .retrieve()
    .catch(() => {});
  const aliases = rep?.aliases?.map((e) => e.name) ?? [];
  if (aliases.includes('entrances')) return true;
  return false;
}

async function createTimestampedCollection(schema) {
  // To avoid down time when doing a full import, we first import the data into a new timestamped collection
  // Then switch the alias this new collection
  // Finaly remove the old collection
  // https://typesense.org/docs/29.0/api/collections.html#using-an-alias
  const alteredName = `${schema.name}_${Date.now()}`;
  const alteredSchema = { ...schema, name: alteredName };

  await client.collections().create(alteredSchema);
  return alteredSchema.name;
}

// Ids per removal request: the ids travel in the request URL, which a proxy
// in front of Typesense may cap at 8 KB. 250 six-digit ids take about 2.5 KB
const DELETE_BATCH_SIZE = 250;

// A few requests for the whole batch; an id that is not indexed is skipped
async function deleteDocuments(collectionName, documentIds) {
  for (let i = 0; i < documentIds.length; i += DELETE_BATCH_SIZE) {
    const batch = documentIds.slice(i, i + DELETE_BATCH_SIZE);
    // eslint-disable-next-line no-await-in-loop
    await client
      .collections(collectionName)
      .documents()
      .delete({ filter_by: `id:[${batch.join(',')}]` });
  }
}

// The ids of every document in a collection
async function exportIds(collectionName) {
  const jsonl = await client
    .collections(collectionName)
    .documents()
    .export({ include_fields: 'id' });
  return jsonl
    .split('\n')
    .filter(Boolean)
    .map((line) => Number(JSON.parse(line).id));
}

async function importDocuments(
  collectionName,
  documents,
  formater,
  action = 'upsert'
) {
  // eslint-disable-next-line no-param-reassign
  if (formater) documents = documents.map((e) => formater(e));

  const results = await client
    .collections(collectionName)
    .documents()
    .import(documents, { action });

  const failedItems = results.filter((item) => item.success === false);
  if (failedItems.length !== 0) {
    sails.log.error(
      'importDocuments error',
      collectionName,
      action,
      documents.length,
      failedItems.length
    );
    sails.log.error('importDocuments failedItems', failedItems);
  }
}

async function switchCollectionAlias(baseCollectionName) {
  const collections = await client.collections().retrieve();

  const selectedCollections = collections
    .map((e) => e.name)
    .filter((e) => e.startsWith(baseCollectionName));

  const latestCollection = selectedCollections
    .map((e) => e.split('_'))
    .filter((e) => e.length === 2)
    .toSorted((a, b) => parseInt(a[1], 10) - parseInt(b[1], 10))
    .pop()
    .join('_');

  await client
    .aliases()
    .upsert(baseCollectionName, { collection_name: latestCollection });

  // Delete previous collections
  const collectionsToDelete = selectedCollections.filter(
    (e) => e !== latestCollection
  );
  collectionsToDelete.forEach((e) => client.collections(e).delete());
}

// https://typesense.org/docs/29.0/api/federated-multi-search.html#federated-search
async function multiSearch(collections, params) {
  return client.multiSearch.perform(
    {
      union: true, // Cannot fetch more than 250 hits with union
      searches: collections,
    },
    params
  );
}

async function search(collection, params) {
  return client.collections(collection).documents().search(params);
}

module.exports = {
  IMPORT_SIZE: 2000,
  isAlive,
  isPopulated,
  deleteDocuments,
  exportIds,
  createTimestampedCollection,
  importDocuments,
  switchCollectionAlias,
  multiSearch,
  search,
};
