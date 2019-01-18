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

export const fetchAdvancedsearchStarted = () => ({
  type: FETCH_ADVANCEDSEARCH_STARTED,
});

export const fetchAdvancedsearchSuccess = results => ({
  type: FETCH_ADVANCEDSEARCH_SUCCESS,
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

export const fetchAdvancedsearchResult = criteria => (dispatch) => {
  dispatch(fetchAdvancedsearchStarted());

  let completeUrl = advancedsearchUrl;
  if (criteria) {
    completeUrl += `?${Object.keys(criteria).map(k => `${k}=${encodeURIComponent(criteria[k])}`).join('&')}`;
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
      dispatch(fetchAdvancedsearchSuccess(JSON.parse(text).results));
    });
  // .catch(error => dispatch(fetchRandomEntryFailure(error)))
};
