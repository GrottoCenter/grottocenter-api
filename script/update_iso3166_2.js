/* eslint no-console: "off" */
/* eslint no-continue: "off" */
/* eslint no-await-in-loop: "off" */

// Run with:
// node script/update_iso3166_2.js

const fs = require('fs');
const https = require('https');
const path = require('path');

async function httpGet(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode !== 200)
          reject(new Error(`Status code is not 200: ${res.statusCode}`));
        const chunks = [];
        res.on('data', (d) => chunks.push(d));
        res.on('end', () => resolve(Buffer.concat(chunks).toString()));
      })
      .on('error', (err) => reject(err));
  });
}

async function aggregateTranslations(supportedLanguages) {
  const translation = {};
  for (let i = 0; i < supportedLanguages.length; i += 1) {
    const lang = supportedLanguages[i];
    console.log(`- Language: ${lang}`);
    const poData = await httpGet(
      `https://salsa.debian.org/iso-codes-team/iso-codes/-/raw/main/iso_3166-2/${lang}.po`
    ).catch(() => null);
    // console.log('aggregateTranslation lang', poData?.length)
    if (!poData) continue;

    let key = '';
    for (const line of poData.split('\n')) {
      const keyMatch = line.match(/msgid "(.*)"/);
      if (keyMatch) key = keyMatch[1];

      const valueMatch = line.match(/msgstr "(.*)"/);
      if (key && valueMatch) {
        if (!translation[key])
          translation[key] = Array(supportedLanguages.length).fill(null);
        translation[key][i] = valueMatch[1];
        key = '';
      }
    }
  }
  return translation;
}

function writeSQLFile(supportedLanguages, codes, translations) {
  const sqlColumnsName = supportedLanguages.map((e) => `name_${e}`).join(',');
  const sqlHeader = `\\c grottoce;

-- Generated by 'script/update_iso3166_2.js'
INSERT INTO public.t_iso3166_2 (iso, name, ${sqlColumnsName}) VALUES`;

  const lines = [];
  for (const codeObj of codes) {
    let translation = translations[codeObj.name];
    if (!translation) translation = Array(supportedLanguages.length).fill(null);

    const languages = translation
      .map((e) => (e ? `'${e.replace(/'/g, "''")}'` : 'NULL'))
      .join(', ');
    lines.push(
      `\t('${codeObj.code}', '${codeObj.name.replace(
        /'/g,
        "''"
      )}', ${languages})`
    );
  }

  const filename = 'sql/2_2023_03_17_iso3166_2.sql';
  fs.writeFileSync(
    path.join(`${__dirname}/../${filename}`),
    [sqlHeader, lines.join(',\n'), ';'].join('\n')
  );
}

async function main() {
  // Data are downloaded from the gitlab of Debian
  console.log(`Getting ISO codes`);
  const codesStr = await httpGet(
    'https://salsa.debian.org/iso-codes-team/iso-codes/-/raw/main/data/iso_3166-2.json'
  );
  const filename = 'config/constants/iso3166_2_codes.json';
  const codes = JSON.parse(codesStr);
  fs.writeFileSync(
    path.join(`${__dirname}/../${filename}`),
    JSON.stringify(codes, null, 2)
  );

  console.log(`Getting translations:`);
  const supportedLanguages = [
    'ar',
    'bg',
    'ca',
    'de',
    'el',
    'en',
    'es',
    'fr',
    'he',
    'id',
    'it',
    'ja',
    'nl',
    'pt',
    'ro',
  ];
  const translations = await aggregateTranslations(supportedLanguages);

  console.log(`Updating the SQL file`);
  writeSQLFile(supportedLanguages, codes['3166-2'], translations);
  console.log(`All done`);
}
main();
