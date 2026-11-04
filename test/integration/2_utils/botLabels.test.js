const fs = require('fs');
const path = require('path');
const should = require('should');

const ROOT = path.join(__dirname, '../../..');

// ISO 639-3 code of each of the front's 15 UI languages, as in t_language
const CODE_BY_LANGUAGE = {
  ar: 'ara',
  bg: 'bul',
  ca: 'cat',
  de: 'deu',
  el: 'ell',
  en: 'eng',
  es: 'spa',
  fr: 'fra',
  he: 'heb',
  id: 'ind',
  it: 'ita',
  ja: 'jpn',
  nl: 'nld',
  pt: 'por',
  ro: 'ron',
};

// The front's UI languages (public/lang/<lang>.json in grottocenter-front),
// written here on purpose: the test must not need the front repository, and a
// language added to the front is a decision to take, not a silent change
const FRONT_LANGUAGES = Object.keys(CODE_BY_LANGUAGE);

describe('Bot page labels', () => {
  let labels;
  let LABEL_KEYS;
  let FRONT_LANGUAGES_USED;

  before(() => {
    /* eslint-disable global-require */
    ({
      LABELS: labels,
      LABEL_KEYS,
      FRONT_LANGUAGES: FRONT_LANGUAGES_USED,
    } = require('../../../api/utils/botLabels'));
    /* eslint-enable global-require */
  });

  it('covers the 15 languages of the front', () => {
    should([...FRONT_LANGUAGES_USED].sort()).deepEqual(FRONT_LANGUAGES);
    should(Object.keys(labels).sort()).deepEqual(FRONT_LANGUAGES);
  });

  FRONT_LANGUAGES.forEach((lang) => {
    it(`has, for ${lang}, a non-empty text for every label the templates use, and nothing else`, () => {
      const file = JSON.parse(
        fs.readFileSync(
          path.join(ROOT, 'api/utils/botLabels', `${lang}.json`),
          'utf8'
        )
      );
      should(Object.keys(file).sort()).deepEqual(
        Object.keys(LABEL_KEYS).sort()
      );
      Object.entries(file).forEach(([id, text]) => {
        should(text).be.a.String();
        should(text.trim()).not.equal('', `${lang}.${id} is empty`);
      });
    });
  });

  it('holds real translations, not the English text copied into every file', () => {
    const english = labels.en;
    FRONT_LANGUAGES.filter((lang) => lang !== 'en').forEach((lang) => {
      const translated = Object.keys(english).filter(
        (id) => labels[lang][id] !== english[id]
      );
      should(translated.length).be.above(
        Object.keys(english).length / 2,
        `${lang} has only ${translated.length} labels that differ from English`
      );
    });
    should(labels.pt.depth).equal('Profundidade');
    should(labels.fr.depth).equal('Profondeur');
    should(labels.en.depth).equal('Depth');
  });

  it('lists the label ids the templates and the page model use, and every listed id is used', () => {
    const sources = [
      path.join(ROOT, 'api/utils/botPageModel.js'),
      path.join(ROOT, 'api/utils/botHubModel.js'),
      path.join(ROOT, 'api/utils/botModelParts.js'),
      ...fs
        .readdirSync(path.join(ROOT, 'views/bot'))
        .map((name) => path.join(ROOT, 'views/bot', name)),
    ].map((file) => fs.readFileSync(file, 'utf8'));
    const used = new Set();
    sources.forEach((source) => {
      // labels.depth, and the ids of the flag table: ['dangerCo2', entrance.dangerCo2]
      [
        ...source.matchAll(/\blabels\.(\w+)/g),
        ...source.matchAll(/\['(\w+)', entrance\.\w+\]/g),
      ].forEach((match) => used.add(match[1]));
    });
    should(used.size).be.above(25);
    should([...used].sort()).deepEqual(Object.keys(LABEL_KEYS).sort());
  });

  describe('a page in each language', () => {
    let BotRenderService;
    before(() => {
      // eslint-disable-next-line global-require
      BotRenderService = require('../../../api/services/bot/BotRenderService');
    });

    FRONT_LANGUAGES.forEach((lang) => {
      it(`uses the ${lang} labels for a cave whose main name is in ${lang}`, () => {
        const code = CODE_BY_LANGUAGE[lang];
        const html = BotRenderService.render(
          {
            entity_type: 'cave',
            entity_id: 1,
            language: code,
            page: { id: 1, name: 'x', language: code, depth: 10 },
          },
          {
            languageTags: new Map(
              Object.entries(CODE_BY_LANGUAGE).map(([l, c]) => [c, l])
            ),
            countryNames: new Map(),
            hubLinks: BotRenderService.NO_HUB_LINKS,
          }
        );
        // Right-to-left languages are laid out as such
        const dir = ['ar', 'he'].includes(lang) ? ' dir="rtl"' : '';
        should(html).containEql(`<html lang="${lang}"${dir}>`);
        should(html).containEql(`<dt>${labels[lang].depth}</dt>`);
      });
    });
  });
});
