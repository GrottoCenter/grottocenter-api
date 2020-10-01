import fetch from 'isomorphic-fetch';
import { postCaverGroupsUrl } from '../conf/Config';
import { getAuthToken } from '../helpers/AuthHelper';

// ==========
export const POST_CAVER_GROUPS = 'POST_CAVER_GROUPS';
export const POST_CAVER_GROUPS_SUCCESS = 'POST_CAVER_GROUPS_SUCCESS';
export const POST_CAVER_GROUPS_FAILURE = 'POST_CAVER_GROUPS_FAILURE';

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
  return (dispatch) => {
    dispatch(postCaverGroupsAction());

    const authToken = getAuthToken();
    const requestOptions = {
      method: 'POST',
      body: JSON.stringify({
        token: authToken,
        groups,
      }),
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
