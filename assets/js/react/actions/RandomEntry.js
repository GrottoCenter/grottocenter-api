import fetch from 'isomorphic-fetch';
import { findRandomEntryUrl } from '../conf/Config';
import makeErrorMessage from '../helpers/makeErrorMessage';

//
//
// A C T I O N S
//
//

export const FETCH_RANDOMENTRY = 'FETCH_RANDOMENTRY';
export const FETCH_RANDOMENTRY_SUCCESS = 'FETCH_RANDOMENTRY_SUCCESS';
export const FETCH_RANDOMENTRY_FAILURE = 'FETCH_RANDOMENTRY_FAILURE';

//
//
// A C T I O N S - C R E A T O R S
//
//

export const fetchRandomEntryNumber = () => ({
  type: FETCH_RANDOMENTRY,
  entry: undefined,
});

export const fetchRandomEntrySuccess = (entry) => ({
  type: FETCH_RANDOMENTRY_SUCCESS,
  entry,
});

export const fetchRandomEntryFailure = (error) => ({
  type: FETCH_RANDOMENTRY_FAILURE,
  error,
});

//
//
// T H U N K S
//
//

export const loadRandomEntry = () => (dispatch) => {
  dispatch(fetchRandomEntryNumber());

  return fetch(findRandomEntryUrl)
    .then((response) => {
      if (response.status >= 400) {
        throw new Error(response.status);
      }
      return response.text();
    })
    .then((text) => dispatch(fetchRandomEntrySuccess(JSON.parse(text))))
    .catch((error) =>
      dispatch(
        fetchRandomEntryFailure(
          makeErrorMessage(error.message, `Fetching random entrance`),
        ),
      ),
    );
};
