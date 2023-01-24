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
const moment = require('moment');
/**
 *
 * @param {Date} entityDate the date that we need to test
 * @returns {int} the score associated with the date
 */
const getIndividualScoreAboutLastestDateOfUpdate = (entityDate) => {
  const mEntityDate = moment(entityDate);
  const now = moment();
  if (entityDate) {
    if (mEntityDate.isAfter(now.subtract(2, 'years'))) {
      return 7;
    }
    if (mEntityDate.isAfter(now.subtract(5, 'years'))) {
      return 5;
    }
    if (mEntityDate.isAfter(now.subtract(10, 'years'))) {
      return 3;
    }
    return 1;
  }
  return 0;
};

/**
 *
 * @param {int} nbContributions the number of contributions we need to test
 * @returns {int} the score associated with the number of contributions
 */
const getIndividualScoreAboutNbContributions = (nbContributions) => {
  if (nbContributions) {
    // nbContributionsNumber is a string, but we want to compare with an int
    const nbContributionsNumber = Number.parseInt(nbContributions, 10);
    if (nbContributionsNumber <= 0) {
      return 0;
    }
    if (nbContributionsNumber === 1) {
      return 3;
    }
    // (nbContributions >= 2)
    return 7;
  }
  return 0;
};

/**
 *
 * @param {Object} entrance the entrance information to compute the quality of its data
 * @returns {int} the score associated at the entrance after the computation of the quality of its data
 */
const getQualityData = (entrance) => {
  let score = 0;

  // calculate score related to the date of the last update
  score += getIndividualScoreAboutLastestDateOfUpdate(
    entrance.general_latest_date_of_update
  );
  score += getIndividualScoreAboutLastestDateOfUpdate(
    entrance.location_latest_date_of_update
  );
  score += getIndividualScoreAboutLastestDateOfUpdate(
    entrance.description_latest_date_of_update
  );
  score += getIndividualScoreAboutLastestDateOfUpdate(
    entrance.document_latest_date_of_update
  );
  score += getIndividualScoreAboutLastestDateOfUpdate(
    entrance.rigging_latest_date_of_update
  );
  score += getIndividualScoreAboutLastestDateOfUpdate(
    entrance.history_latest_date_of_update
  );
  score += getIndividualScoreAboutLastestDateOfUpdate(
    entrance.comment_latest_date_of_update
  );

  // calculate score related to the number of contributors
  score += getIndividualScoreAboutNbContributions(
    entrance.general_nb_contributions
  );
  score += getIndividualScoreAboutNbContributions(
    entrance.location_nb_contributions
  );
  score += getIndividualScoreAboutNbContributions(
    entrance.description_nb_contributions
  );
  score += getIndividualScoreAboutNbContributions(
    entrance.document_nb_contributions
  );
  score += getIndividualScoreAboutNbContributions(
    entrance.rigging_nb_contributions
  );
  score += getIndividualScoreAboutNbContributions(
    entrance.history_nb_contributions
  );
  score += getIndividualScoreAboutNbContributions(
    entrance.comment_nb_contributions
  );

  return score;
};

module.exports = getQualityData;
