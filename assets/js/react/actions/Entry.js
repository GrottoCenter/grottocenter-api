import fetch from 'isomorphic-fetch';
import { getEntryUrl } from '../conf/Config';
import makeErrorMessage from '../helpers/makeErrorMessage';

export const LOAD_ENTRY_SUCCESS = 'LOAD_ENTRY_SUCCESS';
export const LOAD_ENTRY_LOADING = 'LOAD_ENTRY_LOADING';
export const LOAD_ENTRY_ERROR = 'LOAD_ENTRY_ERROR';

export const fetchEntry = (entranceId) => (dispatch) => {
  dispatch({ type: LOAD_ENTRY_LOADING });

  fetch(getEntryUrl + entranceId)
    .then((response) => {
      if (response.status >= 400) {
        throw new Error(response.status);
      }
      response.json();
    })
    .then((data) => dispatch({ type: LOAD_ENTRY_SUCCESS, data }))
    .catch((error) =>
      dispatch({
        type: LOAD_ENTRY_ERROR,
        error: makeErrorMessage(
          error.message,
          `Fetching entrance id ${entranceId}`,
        ),
      }),
    );
};
