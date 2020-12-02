import fetch from 'isomorphic-fetch';
import {
  getAdminsUrl,
  getModeratorsUrl,
  postCaverGroupsUrl,
} from '../conf/Config';

// ==========
export const POST_CAVER_GROUPS = 'POST_CAVER_GROUPS';
export const POST_CAVER_GROUPS_SUCCESS = 'POST_CAVER_GROUPS_SUCCESS';
export const POST_CAVER_GROUPS_FAILURE = 'POST_CAVER_GROUPS_FAILURE';

export const GET_ADMINS = 'GET_ADMINS';
export const GET_ADMINS_SUCCESS = 'GET_ADMINS_SUCCESS';
export const GET_ADMINS_FAILURE = 'GET_ADMINS_FAILURE';

export const GET_MODERATORS = 'GET_MODERATORS';
export const GET_MODERATORS_SUCCESS = 'GET_MODERATORS_SUCCESS';
export const GET_MODERATORS_FAILURE = 'GET_MODERATORS_FAILURE';

// ==========

export const postCaverGroupsAction = () => ({
  type: POST_CAVER_GROUPS,
});

export const postCaverGroupsActionSuccess = (httpCode) => ({
  type: POST_CAVER_GROUPS_SUCCESS,
  httpCode,
});

export const postCaverGroupsActionFailure = (errorMessages, httpCode) => ({
  type: POST_CAVER_GROUPS_FAILURE,
  errorMessages,
  httpCode,
});

export function postCaverGroups(caverId, groups) {
  return (dispatch, getState) => {
    dispatch(postCaverGroupsAction());

    const requestOptions = {
      method: 'POST',
      body: JSON.stringify({
        groups,
      }),
      headers: getState().auth.authorizationHeader,
    };

    return fetch(postCaverGroupsUrl(caverId), requestOptions).then(
      (response) => {
        return response.text().then((responseText) => {
          if (response.status >= 400) {
            const errorMessages = [];
            switch (response.status) {
              case 400:
                errorMessages.push(`Bad request: ${responseText}`);
                break;
              case 401:
                errorMessages.push(
                  'You must be authenticated to change an caver groups.',
                );
                break;
              case 403:
                errorMessages.push(
                  'You are not authorized to change an caver groups.',
                );
                break;
              case 404:
                errorMessages.push(
                  'Server-side update of an caver groups is not available.',
                );
                break;
              case 500:
                errorMessages.push(
                  'A server error occurred, please try again later or contact Wikicaves for more information.',
                );
                break;
              default:
                break;
            }
            dispatch(
              postCaverGroupsActionFailure(errorMessages, response.status),
            );
            throw new Error(
              `Fetching ${postCaverGroupsUrl(caverId)} status: ${
                response.status
              }`,
              errorMessages,
            );
          } else {
            dispatch(postCaverGroupsActionSuccess(response.status));
          }
          return response;
        });
      },
    );
  };
}

export const getAdminsAction = () => ({
  type: GET_ADMINS,
});

export const getAdminsActionSuccess = (admins) => ({
  type: GET_ADMINS_SUCCESS,
  admins,
});

export const getAdminsActionFailure = (errorMessage) => ({
  type: GET_ADMINS_FAILURE,
  errorMessage,
});

export function getAdmins() {
  return (dispatch, getState) => {
    dispatch(getAdminsAction());

    const requestOptions = {
      method: 'GET',
      headers: getState().auth.authorizationHeader,
    };

    return fetch(getAdminsUrl, requestOptions)
      .then((response) => {
        if (response.status >= 400) {
          const errorMessage = `Fetching ${getAdminsUrl} status: ${response.status}`;
          dispatch(getAdminsActionFailure(errorMessage));
        }
        return response.text();
      })
      .then((text) =>
        dispatch(getAdminsActionSuccess(JSON.parse(text).cavers)),
      );
  };
}

export const getModeratorsAction = () => ({
  type: GET_MODERATORS,
});

export const getModeratorsActionSuccess = (moderators) => ({
  type: GET_MODERATORS_SUCCESS,
  moderators,
});

export const getModeratorsActionFailure = (errorMessage) => ({
  type: GET_MODERATORS_FAILURE,
  errorMessage,
});

export function getModerators() {
  return (dispatch, getState) => {
    dispatch(getModeratorsAction());
    const requestOptions = {
      method: 'GET',
      headers: getState().auth.authorizationHeader,
    };

    return fetch(getModeratorsUrl, requestOptions)
      .then((response) => {
        if (response.status >= 400) {
          const errorMessage = `Fetching ${getModeratorsUrl} status: ${response.status}`;
          dispatch(getModeratorsActionFailure(errorMessage));
        }
        return response.text();
      })
      .then((text) =>
        dispatch(getModeratorsActionSuccess(JSON.parse(text).cavers)),
      );
  };
}
