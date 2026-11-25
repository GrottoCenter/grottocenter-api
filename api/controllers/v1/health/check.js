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

// A reachable Typesense whose collections lack fields the code uses cannot
// serve every search. That is reported as `outOfDate`, not `unhealthy`: the
// endpoint still answers 200 (a restart would not fix it, and App Service and
// the Http5xx alert only react to non-2xx), and the BetterStack monitor fails
// on the body instead. See docs/health-monitoring.md.
const checkSearch = async (timeoutMs) => {
  try {
    const isSearchAlive = await withTimeout(
      SearchService.isAlive(),
      timeoutMs,
      'Search check'
    );
    if (!isSearchAlive) {
      sails.log.error('Health check: search reported not alive');
      return { status: 'unhealthy', message: 'Search connection failed' };
    }
    const schema = await withTimeout(
      SearchService.checkIndexSchema(),
      timeoutMs,
      'Search check'
    );
    if (!schema.upToDate) {
      sails.log.error(
        'Health check: search index out of date, run scripts/resync-search.js',
        schema.missing
      );
      return { status: 'outOfDate', message: 'Search index out of date' };
    }
    return { status: 'healthy', message: 'Search connection successful' };
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

    const services = { database, search };
    // unhealthy (503) wins over degraded (200), which wins over healthy.
    const isUnhealthy = [database, search].some(
      (s) => s.status === 'unhealthy'
    );
    const isDegraded = [database, search].some((s) => s.status === 'outOfDate');
    let status = 'healthy';
    if (isUnhealthy) status = 'unhealthy';
    else if (isDegraded) status = 'degraded';
    const healthStatus = {
      status,
      timestamp,
      services,
      build: readBuildInfo(),
    };

    if (isUnhealthy) {
      // App Service only takes action on a non-2xx probe response.
      throw { unhealthy: healthStatus }; // eslint-disable-line no-throw-literal
    }

    return healthStatus;
  },
};
