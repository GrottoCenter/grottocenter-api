import fetch from 'isomorphic-fetch';
import { findOrganizationUrl } from '../conf/Config';
import makeErrorMessage from '../helpers/makeErrorMessage';

export const FETCH_ORGANIZATION = 'FETCH_ORGANIZATION';
export const FETCH_ORGANIZATION_SUCCESS = 'FETCH_ORGANIZATION_SUCCESS';
export const FETCH_ORGANIZATION_FAILURE = 'FETCH_ORGANIZATION_FAILURE';

export const fetchOrganization = () => ({
  type: FETCH_ORGANIZATION,
});

export const fetchOrganizationSuccess = (organization) => ({
  type: FETCH_ORGANIZATION_SUCCESS,
  organization,
});

export const fetchOrganizationFailure = (error) => ({
  type: FETCH_ORGANIZATION_FAILURE,
  error,
});

export function loadOrganization(organizationId) {
  return (dispatch) => {
    dispatch(fetchOrganization());

    return fetch(`${findOrganizationUrl}${organizationId}`)
      .then((response) => {
        if (response.status >= 400) {
          throw new Error(response.status);
        }
        return response.text();
      })
      .then((text) => dispatch(fetchOrganizationSuccess(JSON.parse(text))))
      .catch((error) =>
        dispatch(
          fetchOrganizationFailure(
            makeErrorMessage(
              error.message,
              `Fetching organization id ${organizationId}`,
            ),
          ),
        ),
      );
  };
}
