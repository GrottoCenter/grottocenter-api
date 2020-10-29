import fetch from 'isomorphic-fetch';
import { pipe, defaultTo, map } from 'ramda';
import { processDocumentIds } from '../conf/Config';
import { getAuthHTTPHeader } from '../helpers/AuthHelper';

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
    body: JSON.stringify({ documents: documentsBody }),
    headers: getAuthHTTPHeader(),
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
