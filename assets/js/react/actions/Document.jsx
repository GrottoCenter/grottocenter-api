import fetch from 'isomorphic-fetch';
import { identificationTokenName, postDocumentUrl } from '../conf/Config';

// ==========
export const POST_DOCUMENT = 'POST_DOCUMENT';
export const POST_DOCUMENT_SUCCESS = 'FETCH_LOGIN_SUCCESS';
export const POST_DOCUMENT_FAILURE = 'POST_DOCUMENT_FAILURE';

// ==========

export const postDocumentAction = () => ({
  type: POST_DOCUMENT,
});

export const postDocumentSuccess = () => ({
  type: POST_DOCUMENT_SUCCESS,
});

export const postDocumentFailure = (errorMessages) => ({
  type: POST_DOCUMENT_FAILURE,
  errorMessages,
});

export function postDocument(docAttributes) {
  return (dispatch) => {
    dispatch(postDocumentAction());

    const authToken = window.localStorage.getItem(identificationTokenName);
    const requestOptions = {
      method: 'POST',
      body: JSON.stringify({ ...docAttributes, token: authToken }),
    };

    return fetch(postDocumentUrl, requestOptions)
      .then((response) => {
        if (response.status >= 400) {
          const errorMessages = [];
          switch (response.status) {
            case 401:
              errorMessages.push(
                'You must be authenticated to post a document.',
              );
              break;
            case 403:
              errorMessages.push(
                'You are not authorized to create a document.',
              );
              break;
            case 404:
              errorMessages.push(
                'Server-side creation of the document is not available.',
              );
              break;
            default:
              break;
          }
          dispatch(postDocumentFailure(errorMessages));
          throw new Error(
            `Fetching ${postDocumentUrl} status: ${response.status}`,
            errorMessages,
          );
        }
        return response.json();
      })
      .then(() => {
        dispatch(postDocumentSuccess());
      });
  };
}
