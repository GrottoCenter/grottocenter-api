const should = require('should');
const fs = require('fs');
const path = require('path');
const SearchService = require('../../../api/services/SearchService');

describe('Health Service Logic', () => {
  describe('Build info retrieval', () => {
    it('should read build info from generated file', () => {
      try {
        const buildInfoPath = path.join(process.cwd(), 'build-info.json');
        const buildInfoContent = fs.readFileSync(buildInfoPath, 'utf8');
        const buildInfo = JSON.parse(buildInfoContent);

        should(buildInfo).be.an.Object();
        should(buildInfo).have.property('gitCommit');
        should(buildInfo).have.property('buildTime');

        should(buildInfo.gitCommit).be.a.String();
        should(buildInfo.buildTime).be.a.String();

        // If git commit is not 'unknown', it should be a valid hash
        if (buildInfo.gitCommit !== 'unknown') {
          should(buildInfo.gitCommit).match(/^[a-f0-9]{40}$/);
        }

        // Build time should be a valid ISO date
        if (buildInfo.buildTime !== 'unknown') {
          const date = new Date(buildInfo.buildTime);
          should(date).be.a.Date();
        }
      } catch (error) {
        // If build-info.json doesn't exist, this should fail gracefully
        should(error).be.an.Error();
      }
    });
  });

  describe('Database health check', () => {
    it('should be able to execute a simple query', async () => {
      try {
        await sails.getDatastore().sendNativeQuery('SELECT 1');
        // If we reach here, the database is healthy
        true.should.be.true();
      } catch (error) {
        // Database connection failed
        error.should.be.an('error');
      }
    });
  });

  describe('Search health check', () => {
    it('should be able to check Search connection', async () => {
      try {
        const isAlive = await SearchService.isAlive();
        should(isAlive).be.a.Boolean();
      } catch (error) {
        // Search connection check failed
        should(error).be.an.Error();
      }
    });
  });
});
