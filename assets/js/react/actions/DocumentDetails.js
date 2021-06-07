import fetch from 'isomorphic-fetch';
import { getDocumentDetailsUrl } from '../conf/Config';
import makeErrorMessage from '../helpers/makeErrorMessage';

export const FETCH_DOCUMENT_DETAILS = 'FETCH_DOCUMENT_DETAILS';
export const FETCH_DOCUMENT_DETAILS_SUCCESS = 'FETCH_DOCUMENT_DETAILS_SUCCESS';
export const FETCH_DOCUMENT_DETAILS_FAILURE = 'FETCH_DOCUMENT_DETAILS_FAILURE';

export const fetchDocumentDetails = (documentId, requireUpdate) => (dispatch) => {
  dispatch({ type: FETCH_DOCUMENT_DETAILS });
  const updateParam = requireUpdate ? '?requireUpdate='+requireUpdate : '';
  return fetch(getDocumentDetailsUrl + documentId + updateParam)
    .then((response) => {
      if (response.status >= 400) {
        throw new Error(response.status);
      }
      return response.json();
    })
    .then((data) => dispatch({ type: FETCH_DOCUMENT_DETAILS_SUCCESS, data }))
    .catch((error) =>
      dispatch({
        type: FETCH_DOCUMENT_DETAILS_FAILURE,
        error: makeErrorMessage(
          error.message,
          `Fetching document id ${documentId}`,
        ),
      }),
    );
};
