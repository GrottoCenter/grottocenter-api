import fetch from 'isomorphic-fetch';
import {findGroupUrl} from '../conf/Config';

export const FETCH_GROUP = 'FETCH_GROUP';
export const FETCH_GROUP_SUCCESS = 'FETCH_GROUP_SUCCESS';
export const FETCH_GROUP_FAILURE = 'FETCH_GROUP_FAILURE';

export const fetchGroup = () => {
  return {
    type: FETCH_GROUP,
    partners: undefined
  };
};

export const fetchGroupSuccess = (entry) => {
  return {
    type: FETCH_GROUP_SUCCESS,
    entry: entry
  };
};

export const fetchGroupFailure = (error) => {
  return {
    type: FETCH_GROUP_FAILURE,
    error: error
  };
};

export function loadGroup() {
  return function (dispatch) {
    dispatch(fetchGroup());

    return fetch(findGroupUrl)
    .then((response) => {
      if (response.status >= 400) {
        let errorMessage = 'Fetching ' + findGroupUrl + ' status: ' + response.status;
        dispatch(fetchGroupFailure(errorMessage));
        throw new Error(errorMessage);
      }
      return response.text();
    })
    .then(text => dispatch(fetchGroupSuccess(JSON.parse(text))))
  };
}
