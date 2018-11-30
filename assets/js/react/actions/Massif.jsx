import fetch from 'isomorphic-fetch';
import {findMassifUrl} from '../conf/Config';

export const FETCH_MASSIF = 'FETCH_MASSIF';
export const FETCH_MASSIF_SUCCESS = 'FETCH_MASSIF_SUCCESS';
export const FETCH_MASSIF_FAILURE = 'FETCH_MASSIF_FAILURE';

export const fetchMassif = () => {
  return {
    type: FETCH_MASSIF,
    partners: undefined
  };
};

export const fetchMassifSuccess = (entry) => {
  return {
    type: FETCH_MASSIF_SUCCESS,
    entry: entry
  };
};

export const fetchMassifFailure = (error) => {
  return {
    type: FETCH_MASSIF_FAILURE,
    error: error
  };
};

export function loadMassif() {
  return function (dispatch) {
    dispatch(fetchMassif());

    return fetch(findMassifUrl)
    .then((response) => {
      if (response.status >= 400) {
        let errorMessage = 'Fetching ' + findMassifUrl + ' status: ' + response.status;
        dispatch(fetchMassifFailure(errorMessage));
        throw new Error(errorMessage);
      }
      return response.text();
    })
    .then(text => dispatch(fetchMassifSuccess(JSON.parse(text))))
  };
}
