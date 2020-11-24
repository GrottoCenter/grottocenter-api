import fetch from 'isomorphic-fetch';
import { fetchConvert } from '../conf/Config';
import makeErrorMessage from '../helpers/makeErrorMessage';

export const FETCH_PROJECTIONS_SUCCESS = 'FETCH_PROJECTIONS_SUCCESS';
export const FETCH_PROJECTIONS_FAILURE = 'FETCH_PROJECTIONS_FAILURE';
export const FETCH_PROJECTIONS_LOADING = 'FETCH_PROJECTIONS_LOADING';

export const fetchProjections = () => (dispatch) => {
  dispatch({ type: FETCH_PROJECTIONS_LOADING });
  return fetch(fetchConvert)
    .then((response) => {
      if (response.status >= 400) {
        throw new Error(response.status);
      }
      return response.json();
    })
    .then((data) => {
      dispatch({ type: FETCH_PROJECTIONS_SUCCESS, data });
    })
    .catch((error) =>
      dispatch({
        type: FETCH_PROJECTIONS_FAILURE,
        error: makeErrorMessage(error.message, `Projections`),
      }),
    );
};
