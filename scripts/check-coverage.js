#!/usr/bin/env node

/* eslint-disable no-console, no-shadow */
const fs = require('fs');
const path = require('path');

const threshold = parseFloat(process.argv[2]) || 90;
const coverageFile = path.join(__dirname, '../coverage/coverage-final.json');
const coverage = JSON.parse(fs.readFileSync(coverageFile, 'utf8'));

const results = [];

Object.entries(coverage).forEach(([filePath, data]) => {
  const statements = data.s;
  const total = Object.keys(statements).length;
  const covered = Object.values(statements).filter((count) => count > 0).length;
  const percentage = total > 0 ? (covered / total) * 100 : 0;

  if (percentage < threshold) {
    results.push({
      file: filePath.replace(/^.*\/grottocenter-api\//, ''),
      coverage: percentage.toFixed(2),
      covered,
      total,
    });
  }
});

results.sort((a, b) => parseFloat(a.coverage) - parseFloat(b.coverage));

console.log(`\nFiles with less than ${threshold}% statement coverage:\n`);
results.forEach(({ file, coverage, covered, total }) => {
  console.log(`${coverage.padStart(6)}% - ${covered}/${total} - ${file}`);
});
console.log(`\nTotal: ${results.length} files under ${threshold}% coverage\n`);
