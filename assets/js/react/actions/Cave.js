import fetch from 'isomorphic-fetch';
import { getCaveUrl } from '../conf/Config';
import makeErrorMessage from '../helpers/makeErrorMessage';

export const LOAD_CAVE_SUCCESS = 'LOAD_CAVE_SUCCESS';
export const LOAD_CAVE_LOADING = 'LOAD_CAVE_LOADING';
export const LOAD_CAVE_ERROR = 'LOAD_CAVE_ERROR';

export const fetchCave = (caveId) => (dispatch) => {
  dispatch({ type: LOAD_CAVE_LOADING });

  return fetch(getCaveUrl + caveId)
    .then((response) => {
      if (response.status >= 400) {
        throw new Error(response.status);
      }
      return response.json();
    })
    .then((data) => dispatch({ type: LOAD_CAVE_SUCCESS, data }))
    .catch((error) =>
      dispatch({
        type: LOAD_CAVE_ERROR,
        error: makeErrorMessage(error.message, `Fetching cave id ${caveId}`),
      }),
    );
};
