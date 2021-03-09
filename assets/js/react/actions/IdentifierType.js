import fetch from 'isomorphic-fetch';
import { identifierTypesUrl } from '../conf/Config';
import makeErrorMessage from '../helpers/makeErrorMessage';

export const FETCH_IDENTIFIER_TYPES = 'FETCH_IDENTIFIER_TYPES';
export const FETCH_IDENTIFIER_TYPES_SUCCESS = 'FETCH_IDENTIFIER_TYPES_SUCCESS';
export const FETCH_IDENTIFIER_TYPES_FAILURE = 'FETCH_IDENTIFIER_TYPES_FAILURE';

export const fetchIdentifierTypes = () => ({
  type: FETCH_IDENTIFIER_TYPES,
});

export const fetchIdentifierTypesSuccess = (identifierTypes) => ({
  type: FETCH_IDENTIFIER_TYPES_SUCCESS,
  identifierTypes,
});

export const fetchIdentifierTypesFailure = (error) => ({
  type: FETCH_IDENTIFIER_TYPES_FAILURE,
  error,
});

export function loadIdentifierTypes() {
  return (dispatch) => {
    dispatch(fetchIdentifierTypes());

    return fetch(identifierTypesUrl)
      .then((response) => {
        if (response.status >= 400) {
          throw new Error(response.status);
        }
        return response.text();
      })
      .then((text) =>
        dispatch(fetchIdentifierTypesSuccess(JSON.parse(text).identifierTypes)),
      )
      .catch((error) =>
        dispatch(
          fetchIdentifierTypesFailure(
            makeErrorMessage(error.message, `Fetching identifier types`),
          ),
        ),
      );
  };
}
