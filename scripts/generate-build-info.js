#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Generate build information at build time
 */
function generateBuildInfo() {
  const buildInfo = {
    buildTime: new Date().toISOString(),
    gitCommit: 'unknown',
  };

  // Try to get git commit hash
  try {
    buildInfo.gitCommit = execSync('git log -1 --format="%H"', {
      encoding: 'utf8',
      timeout: 5000,
    }).trim();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Warning: Could not retrieve git commit hash:', error.message);
    // Check if GITHUB_SHA environment variable is available (GitHub Actions)
    if (process.env.GITHUB_SHA) {
      buildInfo.gitCommit = process.env.GITHUB_SHA;
    }
  }

  // Write build info to file
  const buildInfoPath = path.join(__dirname, '..', 'build-info.json');
  fs.writeFileSync(buildInfoPath, JSON.stringify(buildInfo, null, 2));

  // eslint-disable-next-line no-console
  console.log('Build information generated:', buildInfo);
}

// Run if called directly
if (require.main === module) {
  generateBuildInfo();
}

module.exports = { generateBuildInfo };
