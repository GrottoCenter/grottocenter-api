/**
 * Compute entrance data quality score details :
 *
 * For each entrance, we compute it's score for each entity associated to it...
 *    - general
 *    - location
 *    - description
 *    - document
 *    - rigging
 *    - history
 *    - comment
 *
 * ... according to these criterias :
 *  Latest date of update :
 *      - if it's less than 2 years old => 7 pts
 *      - if it's between 5 and 2 years old => 5 pts
 *      - if it's between 5 and 10 years old => 3 pts
 *      - if it's more than 10 years old => 1
 *      - else 0 pts
 *
 *  Number of contributions :
 *      - if it has 0 reviewer => 0 pts
 *      - if it has 1 reviewer => 3 pts
 *      - if it has 2 or more reviewers => 7 pts
 *      - else 0 pts
 */
const dayjs = require('./dayjs');

// Categories of entrance data used for quality scoring
const QUALITY_CATEGORIES = [
  'general',
  'location',
  'description',
  'document',
  'rigging',
  'history',
  'comment',
];

// Date freshness scoring tiers
const DATE_SCORE_RECENT = 7;
const DATE_SCORE_MODERATE = 5;
const DATE_SCORE_OLD = 3;
const DATE_SCORE_VERY_OLD = 1;
const DATE_SCORE_NONE = 0;

// Contribution count scoring tiers
const CONTRIB_SCORE_MULTIPLE = 7;
const CONTRIB_SCORE_SINGLE = 3;
const CONTRIB_SCORE_NONE = 0;

// Age thresholds in years for date freshness scoring
const DATE_THRESHOLD_RECENT = 2;
const DATE_THRESHOLD_MODERATE = 5;
const DATE_THRESHOLD_OLD = 10;

// Derived max scores
const MAX_DATE_SCORE = DATE_SCORE_RECENT;
const MAX_CONTRIB_SCORE = CONTRIB_SCORE_MULTIPLE;
const MAX_RAW_CATEGORY = MAX_DATE_SCORE + MAX_CONTRIB_SCORE;
const MAX_RAW_TOTAL = QUALITY_CATEGORIES.length * MAX_RAW_CATEGORY;

/**
 * The instants N years before `now` at which each date tier ends. A date
 * after a cut-off is less than N years old.
 *
 * Comparing against cut-offs replaces a fractional
 * `dayjs().diff(date, 'year', true)` per date, which cost ~5 µs: a coordinates
 * snapshot scores ~500,000 dates per load, so the diffs alone blocked the event
 * loop for ~2.6 s. Compute the cut-offs once per batch and pass them in.
 *
 * The result is the same as the diff except on a leap day, where dayjs is not
 * monotonic: on 2026-02-28 it rates 2024-02-29 two years old but the day
 * before it younger. Here 2024-02-29 is, like 2024-02-28 noon, under two.
 *
 * @param {Object} [now] a dayjs instance
 * @returns {{ recent: number, moderate: number, old: number }} epoch ms
 */
const getDateCutoffs = (now = dayjs()) => ({
  recent: now.subtract(DATE_THRESHOLD_RECENT, 'year').valueOf(),
  moderate: now.subtract(DATE_THRESHOLD_MODERATE, 'year').valueOf(),
  old: now.subtract(DATE_THRESHOLD_OLD, 'year').valueOf(),
});

/**
 *
 * @param {Date} entityDate the date that we need to test
 * @param {Object} [cutoffs] from getDateCutoffs()
 * @returns {int} the score associated with the date
 */
const getIndividualScoreAboutLastestDateOfUpdate = (
  entityDate,
  cutoffs = getDateCutoffs()
) => {
  if (!entityDate) return DATE_SCORE_NONE;
  // pg returns timestamps as Date; dayjs parses anything else
  const time =
    entityDate instanceof Date
      ? entityDate.getTime()
      : dayjs(entityDate).valueOf();
  if (time > cutoffs.recent) return DATE_SCORE_RECENT;
  if (time > cutoffs.moderate) return DATE_SCORE_MODERATE;
  if (time > cutoffs.old) return DATE_SCORE_OLD;
  return DATE_SCORE_VERY_OLD;
};

/**
 *
 * @param {int} nbContributions the number of contributions we need to test
 * @returns {int} the score associated with the number of contributions
 */
const getIndividualScoreAboutNbContributions = (nbContributions) => {
  if (nbContributions) {
    const nbContributionsNumber = Number.parseInt(nbContributions, 10);
    if (nbContributionsNumber <= 0) return CONTRIB_SCORE_NONE;
    if (nbContributionsNumber === 1) return CONTRIB_SCORE_SINGLE;
    return CONTRIB_SCORE_MULTIPLE;
  }
  return CONTRIB_SCORE_NONE;
};

/**
 *
 * @param {Object} entrance the entrance information to compute the quality of its data
 * @param {Object} [cutoffs] from getDateCutoffs(), shared across a batch
 * @returns {int} the score (0–100) after normalizing the raw quality sum
 */
const getQualityData = (entrance, cutoffs = getDateCutoffs()) => {
  let score = 0;
  for (const cat of QUALITY_CATEGORIES) {
    score += getIndividualScoreAboutLastestDateOfUpdate(
      entrance[`${cat}_latest_date_of_update`],
      cutoffs
    );
    score += getIndividualScoreAboutNbContributions(
      entrance[`${cat}_nb_contributions`]
    );
  }
  return Math.round((score / MAX_RAW_TOTAL) * 100);
};

/**
 *
 * @param {Object} entrance row from v_data_quality_compute_entrance
 * @returns {Object} per-category breakdown with 7 entity type scores (each 0–100)
 */
const getQualityBreakdown = (entrance) => {
  const breakdown = {};
  const cutoffs = getDateCutoffs();
  for (const cat of QUALITY_CATEGORIES) {
    const dateScore = getIndividualScoreAboutLastestDateOfUpdate(
      entrance[`${cat}_latest_date_of_update`],
      cutoffs
    );
    const contribScore = getIndividualScoreAboutNbContributions(
      entrance[`${cat}_nb_contributions`]
    );
    breakdown[cat] = Math.round(
      ((dateScore + contribScore) / MAX_RAW_CATEGORY) * 100
    );
  }
  return breakdown;
};

module.exports = {
  QUALITY_CATEGORIES,
  MAX_DATE_SCORE,
  MAX_CONTRIB_SCORE,
  MAX_RAW_CATEGORY,
  MAX_RAW_TOTAL,
  getDateCutoffs,
  getQualityData,
  getQualityBreakdown,
};
