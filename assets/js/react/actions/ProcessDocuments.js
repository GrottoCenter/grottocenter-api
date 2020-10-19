import fetch from 'isomorphic-fetch';
import { pipe, defaultTo, map } from 'ramda';
import { identificationTokenName, processDocumentIds } from '../conf/Config';

export const POST_PROCESS_DOCUMENTS = 'POST_PROCESS_DOCUMENTS';
export const POST_PROCESS_DOCUMENTS_SUCCESS = 'POST_PROCESS_DOCUMENTS_SUCCESS';
export const POST_PROCESS_DOCUMENTS_FAILURE = 'POST_PROCESS_DOCUMENTS_FAILURE';

export const postProcessDocumentsAction = () => ({
  type: POST_PROCESS_DOCUMENTS,
});

export const postProcessDocumentsSuccess = () => ({
  type: POST_PROCESS_DOCUMENTS_SUCCESS,
});

export const postProcessDocumentsFailure = (errorMessages) => ({
  type: POST_PROCESS_DOCUMENTS_FAILURE,
  errorMessages,
});

export const postProcessDocuments = (ids, isValidated, comment) => (
  dispatch,
) => {
  dispatch(postProcessDocumentsAction());

  const authToken = window.localStorage.getItem(identificationTokenName);
  const documentsBody = pipe(
    defaultTo([]),
    map((id) => ({
      id,
      isValidated: isValidated.toString(),
      validationComment: comment,
    })),
  )(ids);
  const requestOptions = {
    method: 'PUT',
    body: JSON.stringify({ documents: documentsBody, token: authToken }),
  };

  return fetch(processDocumentIds, requestOptions)
    .then((response) => {
      if (response.status >= 400) {
        throw new Error(
          `Post ${processDocumentIds} status: ${response.status}`,
        );
      } else {
        dispatch(postProcessDocumentsSuccess());
      }
    })
    .catch((errorMessage) => {
      dispatch(postProcessDocumentsFailure(errorMessage));
    });
};
