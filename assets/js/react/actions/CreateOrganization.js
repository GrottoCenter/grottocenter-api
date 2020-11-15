import fetch from 'isomorphic-fetch';
import { postOrganizationUrl } from '../conf/Config';

export const POST_ORGANIZATION = 'POST_ORGANIZATION';
export const POST_ORGANIZATION_SUCCESS = 'POST_ORGANIZATION_SUCCESS';
export const POST_ORGANIZATION_FAILURE = 'POST_ORGANIZATION_FAILURE';

export const postOrganizationAction = () => ({
  type: POST_ORGANIZATION,
});

export const postOrganizationSuccess = (organization) => ({
  type: POST_ORGANIZATION_SUCCESS,
  organization,
});

export const postOrganizationFailure = (error) => ({
  type: POST_ORGANIZATION_FAILURE,
  error,
});

export const postOrganization = (name) => (dispatch, getState) => {
  dispatch(postOrganizationAction());

  const requestOptions = {
    method: 'POST',
    body: JSON.stringify({ name }),
    headers: getState().auth.authorizationHeader,
  };

  return fetch(postOrganizationUrl, requestOptions)
    .then((response) => {
      if (response.status >= 400) {
        throw new Error(response.status);
      }
      return response.text();
    })
    .then((text) => dispatch(postOrganizationSuccess(JSON.parse(text))))
    .catch((errorMessage) => {
      dispatch(postOrganizationFailure(errorMessage));
    });
};
