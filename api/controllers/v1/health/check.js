const fs = require('fs');
const path = require('path');
const ElasticsearchService = require('../../../services/ElasticsearchService');

module.exports = {
  friendlyName: 'Health check',

  description: 'Check the health of the API and its dependencies',

  exits: {
    success: {
      description: 'Health check completed successfully',
      responseType: 'ok',
    },
    serverError: {
      description: 'Health check failed',
      responseType: 'serverError',
    },
  },

  async fn() {
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {},
    };

    // Check database health
    try {
      await sails.getDatastore().sendNativeQuery('SELECT 1');
      healthStatus.services.database = {
        status: 'healthy',
        message: 'Database connection successful',
      };
    } catch (error) {
      healthStatus.services.database = {
        status: 'unhealthy',
        message: `Database connection failed: ${error.message}`,
      };
      healthStatus.status = 'unhealthy';
    }

    // Check Elasticsearch health
    try {
      const isESAlive = await ElasticsearchService.isConnectionAlive();

      if (isESAlive) {
        healthStatus.services.elasticsearch = {
          status: 'healthy',
          message: 'Elasticsearch connection successful',
        };
      } else {
        healthStatus.services.elasticsearch = {
          status: 'unhealthy',
          message: 'Elasticsearch connection failed',
        };
        healthStatus.status = 'unhealthy';
      }
    } catch (error) {
      healthStatus.services.elasticsearch = {
        status: 'unhealthy',
        message: `Elasticsearch check failed: ${error.message}`,
      };
      healthStatus.status = 'unhealthy';
    }

    // Get build information from generated file
    try {
      const buildInfoPath = path.join(process.cwd(), 'build-info.json');
      const buildInfoContent = fs.readFileSync(buildInfoPath, 'utf8');
      healthStatus.build = JSON.parse(buildInfoContent);
    } catch (error) {
      healthStatus.build = {
        gitCommit: 'unknown',
        buildTime: 'unknown',
        error: `Failed to read build info: ${error.message}`,
      };
    }

    // Return appropriate status code based on overall health
    if (healthStatus.status === 'unhealthy') {
      this.res.status(503);
    }

    return healthStatus;
  },
};
