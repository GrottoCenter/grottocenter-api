/* eslint no-console: "off" */

// Regenerates api/utils/botLabels/<lang>.json from the front's translation
// files (GrottoCenter/grottocenter-front, packages/web-app/public/lang).
//
//   node scripts/generate-bot-labels.js [langDir]          write the files
//   node scripts/generate-bot-labels.js --check [langDir]  fail if they differ
//
// langDir defaults to ../grottocenter-front/packages/web-app/public/lang. A key
// the front lacks or leaves empty for a language falls back to its English text.
// The generated files are committed: the app and the tests do not need the front.

const fs = require('fs');
const path = require('path');
const { LABEL_KEYS, FRONT_LANGUAGES } = require('../api/utils/botLabels/keys');

const OUT_DIR = path.join(__dirname, '../api/utils/botLabels');
const args = process.argv.slice(2);
const check = args.includes('--check');
const langDir = path.resolve(
  args.find((arg) => !arg.startsWith('--')) ||
    path.join(
      __dirname,
      '../../grottocenter-front/packages/web-app/public/lang'
    )
);

const readLang = (lang) =>
  JSON.parse(fs.readFileSync(path.join(langDir, `${lang}.json`), 'utf8'));

const english = readLang('en');
const missingInEnglish = Object.values(LABEL_KEYS).filter(
  (key) => typeof english[key] !== 'string' || english[key] === ''
);
if (missingInEnglish.length > 0) {
  console.error(`English text missing in the front for: ${missingInEnglish}`);
  process.exit(1);
}

let stale = 0;
FRONT_LANGUAGES.forEach((lang) => {
  const source = readLang(lang);
  const labels = Object.fromEntries(
    Object.entries(LABEL_KEYS).map(([id, key]) => [
      id,
      typeof source[key] === 'string' && source[key] !== ''
        ? source[key]
        : english[key],
    ])
  );
  const content = `${JSON.stringify(labels, null, 2)}\n`;
  const file = path.join(OUT_DIR, `${lang}.json`);
  if (check) {
    if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== content) {
      console.error(`${lang}.json differs from the front`);
      stale += 1;
    }
  } else {
    fs.writeFileSync(file, content);
  }
});

if (check && stale > 0) process.exit(1);
console.log(check ? 'Labels are up to date' : 'Labels written');
