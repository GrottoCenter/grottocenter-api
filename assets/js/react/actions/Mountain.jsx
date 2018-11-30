import fetch from 'isomorphic-fetch';
import {findMountainUrl} from '../conf/Config';

export const FETCH_MOUNTAIN = 'FETCH_MOUNTAIN';
export const FETCH_MOUNTAIN_SUCCESS = 'FETCH_MOUNTAIN_SUCCESS';
export const FETCH_MOUNTAIN_FAILURE = 'FETCH_MOUNTAIN_FAILURE';

export const fetchMountain = () => {
  return {
    type: FETCH_MOUNTAIN,
    partners: undefined
  };
};

export const fetchMountainSuccess = (entry) => {
  return {
    type: FETCH_MOUNTAIN_SUCCESS,
    entry: entry
  };
};

export const fetchMountainFailure = (error) => {
  return {
    type: FETCH_MOUNTAIN_FAILURE,
    error: error
  };
};

export function loadMountain() {
  return function (dispatch) {
    dispatch(fetchMountain());

    return fetch(findMountainUrl)
    .then((response) => {
      if (response.status >= 400) {
        let errorMessage = 'Fetching ' + findMountainUrl + ' status: ' + response.status;
        dispatch(fetchMountainFailure(errorMessage));
        throw new Error(errorMessage);
      }
      return response.text();
    })
    .then(text => dispatch(fetchMountainSuccess(JSON.parse(text))))
  };
}
