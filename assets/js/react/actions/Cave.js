import fetch from 'isomorphic-fetch';
import { getCaveUrl } from '../conf/Config';

export const LOAD_CAVE_SUCCESS = 'LOAD_CAVE_SUCCESS';
export const LOAD_CAVE_LOADING = 'LOAD_CAVE_LOADING';
export const LOAD_CAVE_ERROR = 'LOAD_CAVE_ERROR';

export const fetchCave = (caveId) => (dispatch) => {
  dispatch({ type: LOAD_CAVE_LOADING });

  fetch(getCaveUrl + caveId)
    .then((response) => response.json())
    .then(
      (data) => dispatch({ type: LOAD_CAVE_SUCCESS, data }),
      (error) =>
        dispatch({
          type: LOAD_CAVE_ERROR,
          error: error.message || 'Unexpected error',
        }),
    );
};
