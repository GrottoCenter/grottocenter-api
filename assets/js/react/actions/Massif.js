import fetch from 'isomorphic-fetch';
import { findMassifUrl } from '../conf/Config';
import makeErrorMessage from '../helpers/makeErrorMessage';

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
          throw new Error(response.status);
        }
        return response.text();
      })
      .then((text) => dispatch(fetchMassifSuccess(JSON.parse(text))))
      .catch((error) =>
        dispatch(
          fetchMassifFailure(
            makeErrorMessage(error.message, `Fetching massif id ${massifId}`),
          ),
        ),
      );
  };
}
