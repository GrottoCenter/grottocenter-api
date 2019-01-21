import fetch from 'isomorphic-fetch';
import { advancedsearchUrl } from '../conf/Config';

//
//
// A C T I O N S
//
//

export const FETCH_ADVANCEDSEARCH_STARTED = 'FETCH_ADVANCEDSEARCH_STARTED';
export const FETCH_ADVANCEDSEARCH_SUCCESS = 'FETCH_ADVANCEDSEARCH_SUCCESS';
export const FETCH_ADVANCEDSEARCH_FAILURE = 'FETCH_ADVANCEDSEARCH_FAILURE';

export const RESET_ADVANCEDSEARCH_RESULTS = 'RESET_ADVANCEDSEARCH_RESULTS';

//
//
// A C T I O N S - C R E A T O R S
//
//

// from & limit are used for pagination
export const fetchAdvancedsearchStarted = criterias => ({
  type: FETCH_ADVANCEDSEARCH_STARTED,
  criterias,
});

export const fetchAdvancedsearchSuccess = (results, totalNbResults) => ({
  type: FETCH_ADVANCEDSEARCH_SUCCESS,
  totalNbResults,
  results,
});

export const fetchAdvancedsearchFailure = error => ({
  type: FETCH_ADVANCEDSEARCH_FAILURE,
  error,
});

export const resetAdvancedSearchResults = () => ({
  type: RESET_ADVANCEDSEARCH_RESULTS,
});

//
//
// T H U N K S
//
//

export const fetchAdvancedsearchResult = criterias => (dispatch) => {
  dispatch(fetchAdvancedsearchStarted(criterias));

  let completeUrl = advancedsearchUrl;
  if (criterias) {
    completeUrl += `?${Object.keys(criterias).map(k => `${k}=${encodeURIComponent(criterias[k])}`).join('&')}`;
  }

  return fetch(completeUrl)
    .then((response) => {
      if (response.status >= 400) {
        const errorMessage = `Fetching ${completeUrl} status: ${response.status}`;
        dispatch(fetchAdvancedsearchFailure(errorMessage));
        throw new Error(errorMessage);
      }
      return response.text();
    })
    .then((text) => {
      const response = JSON.parse(text);
      dispatch(fetchAdvancedsearchSuccess(response.results, response.totalNbResults));
    });
  // .catch(error => dispatch(fetchRandomEntryFailure(error)))
};
