import fetch from 'isomorphic-fetch';
import { findGroupUrl } from '../conf/Config';

export const FETCH_GROUP = 'FETCH_GROUP';
export const FETCH_GROUP_SUCCESS = 'FETCH_GROUP_SUCCESS';
export const FETCH_GROUP_FAILURE = 'FETCH_GROUP_FAILURE';

export const fetchGroup = () => ({
  type: FETCH_GROUP,
  group: undefined,
});

export const fetchGroupSuccess = (group) => ({
  type: FETCH_GROUP_SUCCESS,
  group,
});

export const fetchGroupFailure = (error) => ({
  type: FETCH_GROUP_FAILURE,
  error,
});

export function loadGroup(groupId) {
  return (dispatch) => {
    dispatch(fetchGroup());

    return fetch(`${findGroupUrl}${groupId}`)
      .then((response) => {
        if (response.status >= 400) {
          const errorMessage = `Fetching ${findGroupUrl} status: ${response.status}`;
          dispatch(fetchGroupFailure(errorMessage));
          throw new Error(errorMessage);
        }
        return response.text();
      })
      .then((text) => dispatch(fetchGroupSuccess(JSON.parse(text))));
  };
}
