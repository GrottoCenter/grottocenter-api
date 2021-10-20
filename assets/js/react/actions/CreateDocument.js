import fetch from 'isomorphic-fetch';
import { postDocumentUrl } from '../conf/Config';

export const POST_DOCUMENT = 'POST_DOCUMENT';
export const POST_DOCUMENT_SUCCESS = 'POST_DOCUMENT_SUCCESS';
export const POST_DOCUMENT_FAILURE = 'POST_DOCUMENT_FAILURE';

export const postDocumentAction = () => ({
  type: POST_DOCUMENT,
});

export const postDocumentSuccess = (document) => ({
  type: POST_DOCUMENT_SUCCESS,
  document,
});

export const postDocumentFailure = (error) => ({
  type: POST_DOCUMENT_FAILURE,
  error,
});

export const postDocument = ({
  document,
  type,
  titleAndDescriptionLanguage,
  author,
  editor,
  description,
  language,
}) => (dispatch, getState) => {
  dispatch(postDocumentAction());
  const requestOptions = {
    method: 'POST',
    body: JSON.stringify({
      publicationDate: document['dct:date'],
      documentType: {
        id: type,
      },
      identifierType: document['dct:identifier'],
      identifier: document['dct:source'],
      titleAndDescriptionLanguage,
      documentMainLanguage: language,
      title: document['rdfs:label'],
      author,
      editor,
      description,
    }),
    headers: getState().login.authorizationHeader,
  };

  return fetch(postDocumentUrl, requestOptions)
    .then((response) => {
      if (response.status >= 400) {
        throw new Error(response.status);
      }
      return response.text();
    })
    .then((text) => dispatch(postDocumentSuccess(JSON.parse(text))))
    .catch((errorMessage) => {
      dispatch(postDocumentFailure(errorMessage));
    });
};
