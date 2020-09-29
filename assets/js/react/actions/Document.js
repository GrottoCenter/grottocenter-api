import fetch from 'isomorphic-fetch';
import { postDocumentUrl } from '../conf/Config';
import { getAuthHTTPHeader } from '../helpers/AuthHelper';

// ==========
export const POST_DOCUMENT = 'POST_DOCUMENT';
export const POST_DOCUMENT_SUCCESS = 'POST_DOCUMENT_SUCCESS';
export const POST_DOCUMENT_FAILURE = 'POST_DOCUMENT_FAILURE';

export const RESET_API_MESSAGES = 'RESET_API_MESSAGES';

// ==========

export const postDocumentAction = () => ({
  type: POST_DOCUMENT,
});

export const postDocumentSuccess = (httpCode) => ({
  type: POST_DOCUMENT_SUCCESS,
  httpCode,
});

export const postDocumentFailure = (errorMessages, httpCode) => ({
  type: POST_DOCUMENT_FAILURE,
  errorMessages,
  httpCode,
});

export const resetApiMessages = () => ({
  type: RESET_API_MESSAGES,
});

export function postDocument(docAttributes) {
  return (dispatch) => {
    dispatch(postDocumentAction());

    const requestOptions = {
      method: 'POST',
      body: JSON.stringify({ ...docAttributes }),
      headers: getAuthHTTPHeader(),
    };

    return fetch(postDocumentUrl, requestOptions).then((response) => {
      return response.text().then((responseText) => {
        if (response.status >= 400) {
          const errorMessages = [];
          switch (response.status) {
            case 400:
              errorMessages.push(`Bad request: ${responseText}`);
              break;
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
            case 500:
              errorMessages.push(
                'A server error occurred, please try again later or contact Wikicaves for more information.',
              );
              break;
            default:
              break;
          }
          dispatch(postDocumentFailure(errorMessages, response.status));
          throw new Error(
            `Fetching ${postDocumentUrl} status: ${response.status}`,
            errorMessages,
          );
        } else {
          dispatch(postDocumentSuccess(response.status));
        }
        return response;
      });
    });
  };
}
