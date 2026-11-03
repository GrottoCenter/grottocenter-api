/**
 * Builds the storage adapter from sails.config.custom.botSurface.storage.
 *
 *   driver: 'local'  localDir
 *   driver: 'azure'  azureConnectionString, azureContainer
 */

const LocalStorageAdapter = require('./LocalStorageAdapter');
const AzureBlobStorageAdapter = require('./AzureBlobStorageAdapter');

const createStorageAdapter = (storage = {}) => {
  switch (storage.driver) {
    case 'local':
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
