import fetch from 'isomorphic-fetch';
import { pipe, defaultTo, map } from 'ramda';
import { processDocumentIds } from '../conf/Config';
import makeErrorMessage from '../helpers/makeErrorMessage';

export const POST_PROCESS_DOCUMENTS = 'POST_PROCESS_DOCUMENTS';
export const POST_PROCESS_DOCUMENTS_SUCCESS = 'POST_PROCESS_DOCUMENTS_SUCCESS';
export const POST_PROCESS_DOCUMENTS_FAILURE = 'POST_PROCESS_DOCUMENTS_FAILURE';

export const postProcessDocumentsAction = () => ({
  type: POST_PROCESS_DOCUMENTS,
});

export const postProcessDocumentsSuccess = () => ({
  type: POST_PROCESS_DOCUMENTS_SUCCESS,
});

export const postProcessDocumentsFailure = (error) => ({
  type: POST_PROCESS_DOCUMENTS_FAILURE,
  error,
});

export const postProcessDocuments = (ids, isValidated, comment) => (
  dispatch,
  getState,
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
    headers: getState().auth.authorizationHeader,
  };

  return fetch(processDocumentIds, requestOptions)
    .then((response) => {
      if (response.status >= 400) {
        throw new Error(response.status);
      } else {
        dispatch(postProcessDocumentsSuccess());
      }
    })
    .catch((error) => {
      dispatch(
        postProcessDocumentsFailure(
          makeErrorMessage(error.message, `Process document ids ${ids}`),
        ),
      );
    });
};
