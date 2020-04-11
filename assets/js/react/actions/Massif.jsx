import fetch from 'isomorphic-fetch';
import { findMassifUrl } from '../conf/Config';

export const FETCH_MASSIF = 'FETCH_MASSIF';
export const FETCH_MASSIF_SUCCESS = 'FETCH_MASSIF_SUCCESS';
export const FETCH_MASSIF_FAILURE = 'FETCH_MASSIF_FAILURE';

export const fetchMassif = () => ({
  type: FETCH_MASSIF,
});

export const fetchMassifSuccess = (massif) => ({
  type: FETCH_MASSIF_SUCCESS,
  massif,
});

export const fetchMassifFailure = (error) => ({
  type: FETCH_MASSIF_FAILURE,
  error,
});

export function loadMassif(massifId) {
  return (dispatch) => {
    dispatch(fetchMassif());

    return fetch(findMassifUrl + massifId)
      .then((response) => {
        if (response.status >= 400) {
          const errorMessage = `Fetching ${findMassifUrl} status: ${response.status}`;
          dispatch(fetchMassifFailure(errorMessage));
          throw new Error(errorMessage);
        }
        return response.text();
      })
      .then((text) => dispatch(fetchMassifSuccess(JSON.parse(text))));
  };
}
