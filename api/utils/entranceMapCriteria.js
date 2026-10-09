/**
 * The three criteria the map filters entrances on: cave size, data quality and
 * interest. Every map output that carries them computes them here, so the
 * high-zoom markers (`GET /geoloc/entrances`) and the low-zoom cluster
 * coordinates (`GET /geoloc/entrancesCoordinates`) cannot disagree on which
 * entrances a filter hides. See #1863.
 */
const { getQualityData } = require('./computeEntranceDataQuality');

// Encoded as integers so the coordinate tuples stay compact.
const SIZE = { SMALL: 1, MEDIUM: 2, LARGE: 3 };

// Mirrors CAVE_SIZE_THRESHOLDS in grottocenter-front
// (packages/web-app/src/components/common/Maps/MapClusters/constants.js),
// which classifies the high-zoom markers. Change both sides together.
//
// Deliberately not derived from t_cave.size_coef: that column uses different
// thresholds, so filtering on it would disagree with the markers.
const SIZE_THRESHOLDS = {
  LARGE: { depth: 100, length: 1000 },
  MEDIUM: { depth: 30, length: 200 },
};

/**
 * @param {number|null|undefined} depth t_cave.depth, in metres
 * @param {number|null|undefined} length t_cave.length, in metres
 * @returns {number} SIZE.LARGE, SIZE.MEDIUM or SIZE.SMALL. A missing
 *   dimension, including an entrance without a cave, counts as zero, as the
 *   front end does.
 */
const getCaveSize = (depth, length) => {
  const d = depth ?? 0;
  const l = length ?? 0;
  if (d >= SIZE_THRESHOLDS.LARGE.depth || l >= SIZE_THRESHOLDS.LARGE.length) {
    return SIZE.LARGE;
  }
  if (d >= SIZE_THRESHOLDS.MEDIUM.depth || l >= SIZE_THRESHOLDS.MEDIUM.length) {
    return SIZE.MEDIUM;
  }
  return SIZE.SMALL;
};

/**
 * Rounded here rather than in SQL: round(...::numeric, 1) would come back from
 * pg as a string, while avg(float8) arrives as a number. One decimal keeps a
 * response that may carry thousands of entrances small, and is all the
 * precision the popup can show — it renders half stars out of 5 from a 0-10
 * rating, so anything finer than 0.1 is invisible. See #1825.
 *
 * @param {number|string|null|undefined} average avg(t_comment.aestheticism)
 * @returns {number|null} null when the entrance has no rating
 */
const roundAestheticism = (average) =>
  average == null ? null : Math.round(Number(average) * 10) / 10;

/**
 * @param {Object} row columns of v_data_quality_compute_entrance, all NULL
 *   when the entrance has no row in the view
 * @returns {number} the 0–100 score, or 0 when the row is missing or has no
 *   general update date
 */
const getEntranceDataQuality = (row) =>
  row.general_latest_date_of_update != null ? getQualityData(row) : 0;

module.exports = {
  SIZE,
  SIZE_THRESHOLDS,
  getCaveSize,
  roundAestheticism,
  getEntranceDataQuality,
};
