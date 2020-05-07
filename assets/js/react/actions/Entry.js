import fetch from 'isomorphic-fetch';
import { getEntryUrl } from '../conf/Config';

export const LOAD_ENTRY_SUCCESS = 'LOAD_ENTRY_SUCCESS';
export const LOAD_ENTRY_LOADING = 'LOAD_ENTRY_LOADING';
export const LOAD_ENTRY_ERROR = 'LOAD_ENTRY_ERROR';

export const fetchEntry = (entryId) => (dispatch) => {
  dispatch({ type: LOAD_ENTRY_LOADING });

  fetch(getEntryUrl + entryId)
    .then((response) => response.json())
    .then(
      (data) => dispatch({ type: LOAD_ENTRY_SUCCESS, data }),
      (error) =>
        dispatch({
          type: LOAD_ENTRY_ERROR,
          error: error.message || 'Unexpected error',
        }),
    );
};
