import fetch from 'isomorphic-fetch';
import { getDocumentDetailsUrl } from '../conf/Config';

// ==========
export const FETCH_DOCUMENT_DETAILS = 'FETCH_DOCUMENT_DETAILS';
export const FETCH_DOCUMENT_DETAILS_SUCCESS = 'FETCH_DOCUMENT_DETAILS_SUCCESS';
export const FETCH_DOCUMENT_DETAILS_FAILURE = 'FETCH_DOCUMENT_DETAILS_FAILURE';

export const fetchDocumentDetails = (documentId) => (dispatch) => {
  dispatch({ type: FETCH_DOCUMENT_DETAILS });
  return fetch(getDocumentDetailsUrl + documentId).then((response) =>
    response.json().then(
      (data) => dispatch({ type: FETCH_DOCUMENT_DETAILS_SUCCESS, data }),
      (error) =>
        dispatch({
          type: FETCH_DOCUMENT_DETAILS_FAILURE,
          error: error.message || 'Unexpected error',
        }),
    ),
  );
};
