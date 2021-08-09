import fetch from 'isomorphic-fetch';
import {
  checkRowsEntrancesUrl,
  checkRowsDocumentsUrl,
  importRowsEntrancesUrl,
  importRowsDocumentsUrl,
} from '../conf/Config';

export const CHECK_ROWS_START = 'CHECK_ROWS_START';
export const CHECK_ROWS_SUCCESS = 'CHECK_ROWS_SUCCESS';
export const CHECK_ROWS_FAILURE = 'CHECK_ROWS_FAILURE';

export const IMPORT_ROWS_START = 'IMPORT_ROWS_START';
export const IMPORT_ROWS_SUCCESS = 'IMPORT_ROWS_SUCCESS';
export const IMPORT_ROWS_FAILURE = 'IMPORT_ROWS_FAILURE';

export const RESET_IMPORT_STATE = 'RESET_IMPORT_STATE';

export const checkRowsStart = () => ({
  type: CHECK_ROWS_START,
});

export const checkRowsSuccess = (requestResult) => ({
  type: CHECK_ROWS_SUCCESS,
  result: requestResult,
});

export const checkRowsFailure = (errorMessage) => ({
  type: CHECK_ROWS_FAILURE,
  error: errorMessage,
});

export const importRowsStart = () => ({
  type: IMPORT_ROWS_START,
});

export const importRowsSuccess = (requestResult) => ({
  type: IMPORT_ROWS_SUCCESS,
  result: requestResult,
});

export const importRowsFailure = (errorMessage) => ({
  type: IMPORT_ROWS_FAILURE,
  error: errorMessage,
});

export const resetImportState = () => ({
  type: RESET_IMPORT_STATE,
});

const checkStatus = (response) => {
  if (response.status >= 200 && response.status <= 300) {
    return response.json();
  }
  const errorMessage = new Error(response.statusText);
  throw errorMessage;
};

const makeBody = (rows) => {
  return rows.map((row) => row.data);
};

export const checkRowsInBdd = (typeRow, rowsData) => (dispatch, getState) => {
  dispatch(checkRowsStart());
  let url;
  switch (typeRow) {
    case 0:
      url = checkRowsEntrancesUrl;
      break;
    case 1:
      url = checkRowsDocumentsUrl;
      break;
    default:
      dispatch(checkRowsFailure('Invalid type of rows.'));
      return;
  }

  const body = makeBody(rowsData);

  const requestBody = JSON.stringify({
    data: body,
  });

  const requestOptions = {
    method: 'POST',
    body: requestBody,
    headers: getState().login.authorizationHeader,
  };

  return fetch(url, requestOptions)
    .then(checkStatus)
    .then((response) => {
      dispatch(checkRowsSuccess(response));
    })
    .catch((error) => {
      dispatch(checkRowsFailure(error.message));
    });
};

export const importRows = (data, typeRow) => (dispatch, getState) => {
  dispatch(importRowsStart());
  let url;
  switch (typeRow) {
    case 0:
      url = importRowsEntrancesUrl;
      break;
    case 1:
      url = importRowsDocumentsUrl;
      break;
    default:
      dispatch(
        importRowsFailure(formatMessage({ id: 'Invalid type of rows.' })),
      );
      return;
  }

  const requestBody = JSON.stringify({
    data,
  });

  const requestOptions = {
    method: 'POST',
    body: requestBody,
    headers: getState().login.authorizationHeader,
  };

  return fetch(url, requestOptions)
    .then(checkStatus)
    .then((response) => {
      dispatch(importRowsSuccess(response));
    })
    .catch((error) => {
      dispatch(importRowsFailure(error.message));
    });
};
