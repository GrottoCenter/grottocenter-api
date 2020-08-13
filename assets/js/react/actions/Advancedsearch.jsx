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

export const FETCH_NEXT_ADVANCEDSEARCH_STARTED =
  'FETCH_NEXT_ADVANCEDSEARCH_STARTED';
export const FETCH_NEXT_ADVANCEDSEARCH_SUCCESS =
  'FETCH_NEXT_ADVANCEDSEARCH_SUCCESS';
export const FETCH_NEXT_ADVANCEDSEARCH_FAILURE =
  'FETCH_NEXT_ADVANCEDSEARCH_FAILURE';

export const FETCH_FULL_ADVANCEDSEARCH_STARTED =
  'FETCH_FULL_ADVANCEDSEARCH_STARTED';
export const FETCH_FULL_ADVANCEDSEARCH_SUCCESS =
  'FETCH_FULL_ADVANCEDSEARCH_SUCCESS';
export const FETCH_FULL_ADVANCEDSEARCH_FAILURE =
  'FETCH_FULL_ADVANCEDSEARCH_FAILURE';

export const RESET_ADVANCEDSEARCH_RESULTS = 'RESET_ADVANCEDSEARCH_RESULTS';

// Start an advanced search from nothing
export const fetchAdvancedsearchStarted = (criterias) => ({
  type: FETCH_ADVANCEDSEARCH_STARTED,
  criterias,
});

export const fetchAdvancedsearchSuccess = (results, totalNbResults) => ({
  type: FETCH_ADVANCEDSEARCH_SUCCESS,
  totalNbResults,
  results,
});

export const fetchAdvancedsearchFailure = (error) => ({
  type: FETCH_ADVANCEDSEARCH_FAILURE,
  error,
});

// Get next page of an existing advanced search
export const fetchNextAdvancedSearchStarted = (criterias) => ({
  type: FETCH_NEXT_ADVANCEDSEARCH_STARTED,
  criterias,
});

export const fetchNextAdvancedSearchSucess = (results) => ({
  type: FETCH_NEXT_ADVANCEDSEARCH_SUCCESS,
  results,
});

export const fetchNextAdvancedSearchFailure = (error) => ({
  type: FETCH_NEXT_ADVANCEDSEARCH_FAILURE,
  error,
});

// Get all results from the previous search criterias
export const fetchFullAdvancedSearchStarted = (criterias) => ({
  type: FETCH_FULL_ADVANCEDSEARCH_STARTED,
  criterias,
});

export const fetchFullAdvancedSearchSucess = (results) => ({
  type: FETCH_FULL_ADVANCEDSEARCH_SUCCESS,
  results,
});

export const fetchFullAdvancedSearchFailure = (error) => ({
  type: FETCH_FULL_ADVANCEDSEARCH_FAILURE,
  error,
});

// Reset everything
export const resetAdvancedSearchResults = () => ({
  type: RESET_ADVANCEDSEARCH_RESULTS,
});

//
//
// T H U N K S
//
//
export const fetchAdvancedsearchResults = (criterias) => (dispatch) => {
  dispatch(fetchAdvancedsearchStarted(criterias));

  let completeUrl = advancedsearchUrl;
  if (criterias) {
    completeUrl += `?${Object.keys(criterias)
      .map((k) => `${k}=${encodeURIComponent(criterias[k])}`)
      .join('&')}`;
  }

  return fetch(completeUrl, { method: 'POST' })
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
      dispatch(
        fetchAdvancedsearchSuccess(response.results, response.totalNbResults),
      );
    });
  // .catch(error => dispatch(fetchRandomEntryFailure(error)))
};

export const fetchNextAdvancedsearchResults = (from, size) => (
  dispatch,
  getState,
) => {
  const currentState = getState().advancedsearch;

  // Load only new data (to avoid duplicates)
  const newFrom = currentState.results.length;
  const newSize = from + size - currentState.results.length;

  const criterias = {
    ...currentState.searchCriterias,
    from: newFrom,
    size: newSize,
  };

  dispatch(fetchNextAdvancedSearchStarted(criterias));

  let completeUrl = advancedsearchUrl;
  if (criterias) {
    completeUrl += `?${Object.keys(criterias)
      .map((k) => `${k}=${encodeURIComponent(criterias[k])}`)
      .join('&')}`;
  }

  return fetch(completeUrl, { method: 'POST' })
    .then((response) => {
      if (response.status >= 400) {
        const errorMessage = `Fetching ${completeUrl} status: ${response.status}`;
        dispatch(fetchNextAdvancedSearchFailure(errorMessage));
        throw new Error(errorMessage);
      }
      return response.text();
    })
    .then((text) => {
      const response = JSON.parse(text);
      dispatch(fetchNextAdvancedSearchSucess(response.results));
    });
  // .catch(error => dispatch(fetchRandomEntryFailure(error)))
};

export const fetchFullAdvancedsearchResults = () => (dispatch, getState) => {
  const currentState = getState().advancedsearch;

  // Load all data
  const criterias = {
    ...currentState.searchCriterias,
    from: 0,
    size: currentState.totalNbResults,
  };

  dispatch(fetchFullAdvancedSearchStarted(criterias));

  let completeUrl = advancedsearchUrl;
  if (criterias) {
    completeUrl += `?${Object.keys(criterias)
      .map((k) => `${k}=${encodeURIComponent(criterias[k])}`)
      .join('&')}`;
  }

  return fetch(completeUrl)
    .then((response) => {
      if (response.status >= 400) {
        const errorMessage = `Fetching ${completeUrl} status: ${response.status}`;
        dispatch(fetchFullAdvancedSearchFailure(errorMessage));
        throw new Error(errorMessage);
      }
      return response.text();
    })
    .then((text) => {
      const response = JSON.parse(text);
      dispatch(fetchFullAdvancedSearchSucess(response.results));
    });
  // .catch(error => dispatch(fetchRandomEntryFailure(error)))
};
