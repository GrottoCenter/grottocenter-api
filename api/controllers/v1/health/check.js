const fs = require('fs');
const path = require('path');
const SearchService = require('../../../services/SearchService');
const withTimeout = require('../../../utils/withTimeout');

// Messages are generic on purpose: the endpoint is public, so the underlying
// errors only go to the logs.
const checkDatabase = async (timeoutMs) => {
  try {
    await withTimeout(
      sails.getDatastore().sendNativeQuery('SELECT 1'),
      timeoutMs,
      'Database check'
    );
    return { status: 'healthy', message: 'Database connection successful' };
  } catch (error) {
    sails.log.error('Health check: database', error);
    return {
      status: 'unhealthy',
      message:
        error.code === 'E_TIMEOUT'
          ? 'Database check timed out'
          : 'Database connection failed',
    };
  }
};

const checkSearch = async (timeoutMs) => {
  try {
    const isSearchAlive = await withTimeout(
      SearchService.isAlive(),
      timeoutMs,
      'Search check'
    );
    if (isSearchAlive) {
      return { status: 'healthy', message: 'Search connection successful' };
    }
    sails.log.error('Health check: search reported not alive');
    return { status: 'unhealthy', message: 'Search connection failed' };
  } catch (error) {
    sails.log.error('Health check: search', error);
    return {
      status: 'unhealthy',
      message:
        error.code === 'E_TIMEOUT'
          ? 'Search check timed out'
          : 'Search connection failed',
    };
  }
};

const readBuildInfo = () => {
  try {
    const buildInfoPath = path.join(process.cwd(), 'build-info.json');
    return JSON.parse(fs.readFileSync(buildInfoPath, 'utf8'));
  } catch (error) {
    sails.log.warn('Health check: build info', error);
    return {
      gitCommit: 'unknown',
      buildTime: 'unknown',
      error: 'Failed to read build info',
    };
  }
};

module.exports = {
  friendlyName: 'Health check',

  description: 'Check the health of the API and its dependencies',

  exits: {
    success: {
      description: 'All dependencies are healthy',
      responseType: 'ok',
    },
    unhealthy: {
      description: 'One or more dependencies are unhealthy',
      responseType: 'serviceUnavailable',
    },
    serverError: {
      description: 'Health check failed',
      responseType: 'serverError',
    },
  },

  async fn() {
    const timeoutMs = sails.config.custom.healthCheckTimeoutMs;
    const timestamp = new Date().toISOString();
    const [database, search] = await Promise.all([
      checkDatabase(timeoutMs),
      checkSearch(timeoutMs),
    ]);

    const isHealthy =
      database.status === 'healthy' && search.status === 'healthy';
    const healthStatus = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp,
      services: { database, search },
      build: readBuildInfo(),
    };

    if (!isHealthy) {
      // App Service only takes action on a non-2xx probe response.
      throw { unhealthy: healthStatus }; // eslint-disable-line no-throw-literal
    }

    return healthStatus;
  },
};
