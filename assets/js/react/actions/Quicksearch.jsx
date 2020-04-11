import fetch from 'isomorphic-fetch';
import { quicksearchUrl } from '../conf/Config';

//
//
// A C T I O N S
//
//

export const RESET_QUICKSEARCH = 'RESET_QUICKSEARCH';
export const FETCH_QUICKSEARCH_SUCCESS = 'FETCH_QUICKSEARCH_SUCCESS';
export const FETCH_QUICKSEARCH_FAILURE = 'FETCH_QUICKSEARCH_FAILURE';
export const SET_CURRENT_ENTRY = 'SET_CURRENT_ENTRY';

//
//
// A C T I O N S - C R E A T O R S
//
//

export const resetQuicksearch = () => ({
  type: RESET_QUICKSEARCH,
  results: undefined,
  error: undefined,
});

export const fetchQuicksearchSuccess = (results) => ({
  type: FETCH_QUICKSEARCH_SUCCESS,
  results,
});

export const fetchQuicksearchFailure = (error) => ({
  type: FETCH_QUICKSEARCH_FAILURE,
  error,
});

export const setCurrentEntry = (entry) => ({
  type: SET_CURRENT_ENTRY,
  entry,
});

//
//
// T H U N K S
//
//

export const fetchQuicksearchResult = (criteria) => (dispatch) => {
  dispatch(resetQuicksearch(criteria));

  let completeUrl = quicksearchUrl;
  if (criteria) {
    completeUrl += `?${Object.keys(criteria)
      .map((k) => `${k}=${encodeURIComponent(criteria[k])}`)
      .join('&')}`;
  }

  return fetch(completeUrl)
    .then((response) => {
      if (response.status >= 400) {
        const errorMessage = `Fetching ${completeUrl} status: ${response.status}`;
        dispatch(fetchQuicksearchFailure(errorMessage));
        throw new Error(errorMessage);
      }
      return response.text();
    })
    .then((text) => {
      dispatch(fetchQuicksearchSuccess(JSON.parse(text).results));
    });
  // .catch(error => dispatch(fetchRandomEntryFailure(error)))
};
