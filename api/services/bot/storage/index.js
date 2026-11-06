/**
 * Builds the storage adapter from sails.config.custom.botSurface.storage.
 *
 *   driver: 'local'  localDir
 *   driver: 'azure'  azureConnectionString, azureContainer
 *
 * The local driver is refused when NODE_ENV is production: a deployment that
 * enables the bot surface and forgets BOT_PAGES_STORAGE=azure would otherwise
 * "delete" withdrawn pages from a directory of the API host, forget them in the
 * manifest, and leave the real blobs online with nothing left that lists them.
 */

const LocalStorageAdapter = require('./LocalStorageAdapter');
const AzureBlobStorageAdapter = require('./AzureBlobStorageAdapter');

const createStorageAdapter = (
  storage = {},
  { env = process.env.NODE_ENV } = {}
) => {
  switch (storage.driver) {
    case 'local':
      if (env === 'production') {
        throw new Error(
          'The local bot pages storage is not allowed in production: set BOT_PAGES_STORAGE=azure (and its connection string and container)'
        );
      }
      return new LocalStorageAdapter(storage.localDir);
    case 'azure':
      return AzureBlobStorageAdapter.fromConnectionString(
        storage.azureConnectionString,
        storage.azureContainer
      );
    default:
      throw new Error(
        `Unknown bot pages storage driver: ${storage.driver} (expected local or azure)`
      );
  }
};

module.exports = {
  createStorageAdapter,
  LocalStorageAdapter,
  AzureBlobStorageAdapter,
};
