/**
 * Labels of the bot pages in the front's UI languages (see keys.js).
 *
 * Pure: loads without Sails.
 */

const { LABEL_KEYS, FRONT_LANGUAGES } = require('./keys');

const ar = require('./ar.json');
const bg = require('./bg.json');
const ca = require('./ca.json');
const de = require('./de.json');
const el = require('./el.json');
const en = require('./en.json');
const es = require('./es.json');
const fr = require('./fr.json');
const he = require('./he.json');
const id = require('./id.json');
const it = require('./it.json');
const ja = require('./ja.json');
const nl = require('./nl.json');
const pt = require('./pt.json');
const ro = require('./ro.json');

const LABELS = Object.freeze({
  ar: Object.freeze(ar),
  bg: Object.freeze(bg),
  ca: Object.freeze(ca),
  de: Object.freeze(de),
  el: Object.freeze(el),
  en: Object.freeze(en),
  es: Object.freeze(es),
  fr: Object.freeze(fr),
  he: Object.freeze(he),
  id: Object.freeze(id),
  it: Object.freeze(it),
  ja: Object.freeze(ja),
  nl: Object.freeze(nl),
  pt: Object.freeze(pt),
  ro: Object.freeze(ro),
});

const labelsLanguage = (tag) =>
  Object.prototype.hasOwnProperty.call(LABELS, tag) ? tag : 'en';

/**
 * @param {string} tag BCP 47 primary subtag of the page language ('pt', or a
 *   3-letter code for a language without a 2-letter one)
 * @returns {Object<string,string>} the labels of that language, the English
 *   ones when the front has no translation for it
 */
const labelsFor = (tag) => LABELS[labelsLanguage(tag)];

const LANGUAGE_OF_LABELS = new Map(
  Object.entries(LABELS).map(([language, labels]) => [labels, language])
);

/**
 * The language a set of labels is in, so that the plural rules of a label are
 * always the ones of its own text: a Russian page has English labels, and
 * "21 caves" in English. Worked out from the labels themselves, so a caller
 * cannot pass the page language by mistake; 'en' for labels that labelsFor did
 * not return.
 *
 * @param {Object<string,string>} labels what labelsFor returned
 * @returns {string}
 */
const languageOfLabels = (labels) => LANGUAGE_OF_LABELS.get(labels) || 'en';

module.exports = {
  labelsFor,
  languageOfLabels,
  LABEL_KEYS,
  FRONT_LANGUAGES,
  LABELS,
};
