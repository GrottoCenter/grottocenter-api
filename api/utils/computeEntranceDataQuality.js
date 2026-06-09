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
 *
 * @param {Date} entityDate the date that we need to test
 * @returns {int} the score associated with the date
 */
const getIndividualScoreAboutLastestDateOfUpdate = (entityDate) => {
  if (!entityDate) return DATE_SCORE_NONE;
  const ageInYears = dayjs().diff(dayjs(entityDate), 'year', true);
  if (ageInYears < DATE_THRESHOLD_RECENT) return DATE_SCORE_RECENT;
  if (ageInYears < DATE_THRESHOLD_MODERATE) return DATE_SCORE_MODERATE;
  if (ageInYears < DATE_THRESHOLD_OLD) return DATE_SCORE_OLD;
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
 * @returns {int} the score (0–100) after normalizing the raw quality sum
 */
const getQualityData = (entrance) => {
  let score = 0;
  for (const cat of QUALITY_CATEGORIES) {
    score += getIndividualScoreAboutLastestDateOfUpdate(
      entrance[`${cat}_latest_date_of_update`]
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
  for (const cat of QUALITY_CATEGORIES) {
    const dateScore = getIndividualScoreAboutLastestDateOfUpdate(
      entrance[`${cat}_latest_date_of_update`]
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
  getQualityData,
  getQualityBreakdown,
};
