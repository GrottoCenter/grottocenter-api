import fetch from 'isomorphic-fetch';
import { getDocumentTypesUrl } from '../conf/Config';
import makeErrorMessage from '../helpers/makeErrorMessage';

export const FETCH_DOCUMENT_TYPES = 'FETCH_DOCUMENT_TYPES';
export const FETCH_DOCUMENT_TYPES_SUCCESS = 'FETCH_DOCUMENT_TYPES_SUCCESS';
export const FETCH_DOCUMENT_TYPES_FAILURE = 'FETCH_DOCUMENT_TYPES_FAILURE';

export const fetchDocumentTypes = () => ({
  type: FETCH_DOCUMENT_TYPES,
});

export const fetchDocumentTypesSuccess = (documentTypes) => ({
  type: FETCH_DOCUMENT_TYPES_SUCCESS,
  documentTypes,
});

export const fetchDocumentTypesFailure = (error) => ({
  type: FETCH_DOCUMENT_TYPES_FAILURE,
  error,
});

export function loadDocumentTypes() {
  return (dispatch) => {
    dispatch(fetchDocumentTypes());

    return fetch(getDocumentTypesUrl)
      .then((response) => {
        if (response.status >= 400) {
          throw new Error(response.status);
        }
        return response.text();
      })
      .then((text) =>
        dispatch(fetchDocumentTypesSuccess(JSON.parse(text).documentTypes)),
      )
      .catch((error) =>
        dispatch(
          fetchDocumentTypesFailure(
            makeErrorMessage(error.message, `Fetching document types`),
          ),
        ),
      );
  };
}
