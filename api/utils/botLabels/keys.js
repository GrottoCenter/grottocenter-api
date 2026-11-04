/**
 * The labels of the bot pages: each id the templates use, mapped to the key of
 * the front's translation files (`public/lang/<lang>.json` in
 * GrottoCenter/grottocenter-front), which hold the text in every UI language.
 *
 * `<lang>.json` next to this file are GENERATED from the front by
 * `node scripts/generate-bot-labels.js` and committed, so neither the app nor
 * the tests need the front repository. Adding a label means adding it here,
 * running the script and committing the result; a test fails when a template
 * uses an id that is not listed, or a language file lacks one.
 *
 * Pure: loads without Sails.
 */

const LABEL_KEYS = Object.freeze({
  cave: 'Cave',
  massif: 'Massif',
  organization: 'Organization',
  depth: 'Depth',
  length: 'Length',
  temperature: 'Temperature',
  divingCave: 'Diving cave',
  entrance: 'Entrance',
  entrances: 'Entrances',
  massifs: 'Massifs',
  // The plural noun, for "cavités: 12" and (capitalized) the heading of a list
  // of caves: the front's 'Caves' reads "Réseaux" in French, like 'Networks'
  cavesCount: 'caves',
  countries: 'Countries',
  regions: 'Regions',
  avgDepth: 'average depth',
  avgLength: 'average length',
  // The figures of a hub or a massif, worded as the SPA's statistics widget
  // words them (number first, then this text); some are ICU plural messages
  figureCaves: 'cave_with_entrances',
  figureNetworks: 'network_count',
  figureDivingCaves: 'diveable_caves',
  figureMassif: 'massif',
  figureMassifs: 'massifs',
  figureTotalLength: 'cumulated length',
  descriptions: 'Descriptions',
  municipality: 'addresstype.municipality',
  county: 'County',
  region: 'Region',
  country: 'Country',
  discoveryYear: 'Year of discovery',
  dangerCo2: 'CO2 risk',
  dangerFlooding: 'Flooding risk',
  dangerRockfall: 'Rockfall risk',
  dangerPollution: 'Pollution risk',
  hasBat: 'Bat habitat',
  needCleanGear: 'Clean gear required',
  needStayOnTrail: 'Stay on trail',
  hasRules: 'Entry rules',
  isTouristic: 'Touristic site',
  website: 'Website',
  since: 'Since',
  yes: 'Yes',
  no: 'No',
});

// The 15 languages of the front's UI. A page in any other language (Polish,
// Hindi...) gets the English labels.
const FRONT_LANGUAGES = Object.freeze([
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
]);

module.exports = { LABEL_KEYS, FRONT_LANGUAGES };
