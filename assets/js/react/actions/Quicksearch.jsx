import fetch from 'isomorphic-fetch';
import {quicksearchUrl} from '../conf/Config';

export const RESET_QUICKSEARCH = 'RESET_QUICKSEARCH';
export const FETCH_QUICKSEARCH_SUCCESS = 'FETCH_QUICKSEARCH_SUCCESS';
export const FETCH_QUICKSEARCH_FAILURE = 'FETCH_QUICKSEARCH_FAILURE';
export const SHOW_MARKER = 'SHOW_MARKER';

export const resetQuicksearch = () => {
  return {
    type: RESET_QUICKSEARCH,
    results: undefined,
    error: undefined
  }
};

export const fetchQuicksearchSuccess = (results) => {
  return {
    type: FETCH_QUICKSEARCH_SUCCESS,
    results: results
  }
};

export const fetchQuicksearchFailure = (error) => {
  return {
    type: FETCH_QUICKSEARCH_FAILURE,
    error: error
  }
};

export const showMarker = (entry) => {
  return {
    type: SHOW_MARKER,
    entry: entry
  }
};

export function fetchQuicksearchResult(criteria) {
  return function (dispatch) {
    dispatch(resetQuicksearch(criteria));

    let completeUrl = quicksearchUrl;
    if (criteria) {
      completeUrl += '?' + Object.keys(criteria).map(k => k + '=' + encodeURIComponent(criteria[k])).join('&');
    }

    return fetch(completeUrl)
    .then((response) => {
      if (response.status >= 400) {
        let errorMessage = 'Fetching ' + quicksearchUrl + ' status: ' + response.status;
        dispatch(fetchQuicksearchFailure(errorMessage));
        throw new Error(errorMessage);
      }
      return response.text();
    })
    .then(text => dispatch(fetchQuicksearchSuccess(JSON.parse(text))))/*
    .catch(error => dispatch(fetchRandomEntryFailure(error)))*/;
  };
}
