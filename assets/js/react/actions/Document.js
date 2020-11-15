import fetch from 'isomorphic-fetch';
import { postDocumentUrl, putDocumentUrl } from '../conf/Config';

// ==========
export const POST_DOCUMENT = 'POST_DOCUMENT';
export const POST_DOCUMENT_SUCCESS = 'POST_DOCUMENT_SUCCESS';
export const POST_DOCUMENT_FAILURE = 'POST_DOCUMENT_FAILURE';

export const UPDATE_DOCUMENT = 'UPDATE_DOCUMENT';
export const UPDATE_DOCUMENT_SUCCESS = 'UPDATE_DOCUMENT_SUCCESS';
export const UPDATE_DOCUMENT_FAILURE = 'UPDATE_DOCUMENT_FAILURE';

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

export const updateDocumentAction = () => ({
  type: UPDATE_DOCUMENT,
});

export const updateDocumentSuccess = (httpCode) => ({
  type: UPDATE_DOCUMENT_SUCCESS,
  httpCode,
});

export const updateDocumentFailure = (errorMessages, httpCode) => ({
  type: UPDATE_DOCUMENT_FAILURE,
  errorMessages,
  httpCode,
});

export const resetApiMessages = () => ({
  type: RESET_API_MESSAGES,
});

export function postDocument(docAttributes) {
  return (dispatch, getState) => {
    dispatch(postDocumentAction());

    // Merge startPage and endPage in one attribute 'pages'
    const { startPage, endPage } = docAttributes;
    let pages = null;

    // A page can be 0 so check for 'if(startPage)' only will not work.
    // That's why we use 'if(startPage === null)' here.
    if (startPage === null && endPage !== null) {
      pages = endPage;
    } else if (startPage !== null && endPage === null) {
      pages = `${startPage},`;
    } else if (startPage !== null && endPage !== null) {
      pages = `${startPage}-${endPage}`;
    }

    const requestOptions = {
      method: 'POST',
      body: JSON.stringify({ ...docAttributes, pages }),
      headers: getState().auth.authorizationHeader,
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

export function updateDocument(docAttributes) {
  return (dispatch, getState) => {
    dispatch(updateDocumentAction());

    // Merge startPage and endPage in one attribute 'pages'
    const { startPage, endPage } = docAttributes;
    let pages = null;

    // A page can be 0 so check for 'if(startPage)' only will not work.
    // That's why we use 'if(startPage === null)' here.
    if (startPage === null && endPage !== null) {
      pages = endPage;
    } else if (startPage !== null && endPage === null) {
      pages = `${startPage},`;
    } else if (startPage !== null && endPage !== null) {
      pages = `${startPage}-${endPage}`;
    }

    const requestOptions = {
      method: 'PUT',
      body: JSON.stringify({ ...docAttributes, pages }),
      headers: getState().auth.authorizationHeader,
    };

    return fetch(putDocumentUrl(docAttributes.id), requestOptions).then(
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
                  'You must be authenticated to update a document.',
                );
                break;
              case 403:
                errorMessages.push(
                  'You are not authorized to update a document.',
                );
                break;
              case 404:
                errorMessages.push(
                  'Server-side update of the document is not available.',
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
            dispatch(updateDocumentFailure(errorMessages, response.status));
            throw new Error(
              `Fetching ${putDocumentUrl} status: ${response.status}`,
              errorMessages,
            );
          } else {
            dispatch(updateDocumentSuccess(response.status));
          }
          return response;
        });
      },
    );
  };
}
