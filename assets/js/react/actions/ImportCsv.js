import fetch from 'isomorphic-fetch';
import { checkRowsBddUrl, importRowsUrl } from '../conf/Config';

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
})

export const importRowsFailure = (errorMessage) =>  ({
    type: IMPORT_ROWS_FAILURE,
    error: errorMessage,
})

export const resetImportState = () => ({
    type: RESET_IMPORT_STATE,
})

const checkStatus = (response) => {
    if(response.status >= 200 && response.status <= 300){
        return response.json();
    } else {
        const errorMessage = new Error(response.statusText);
        throw errorMessage;
    }
}

export const checkRowsInBdd = (typeRow, rowsData) => (dispatch, getState) => {
    dispatch(checkRowsStart());
    let typeRowString;
    switch(typeRow){
        case 0:
            typeRowString = 'entrance';
            break;
        case 1:
            typeRowString = 'document';
            break;
        default:
            dispatch(checkRowsFailure(formatMessage({id : 'Invalid type of rows.'})))
            return;
    }

    const requestBody = JSON.stringify({
        typeRow: typeRowString,
        data: rowsData,
    });

    const requestOptions = {
        method: 'POST',
        body: requestBody,
        headers: getState().login.authorizationHeader,
      };

      return fetch(checkRowsBddUrl, requestOptions)
        .then(checkStatus)
        .then((response) => {
            dispatch(checkRowsSuccess(response))
        })
        .catch((error) => {
            dispatch(checkRowsFailure(error.message))
        });
};

export const importRows = (data, typeRow) => (dispatch, getState) => {
    dispatch(importRowsStart());
    let typeRowString;
    switch(typeRow){
        case 0:
            typeRowString = 'entrance';
            break;
        case 1:
            typeRowString = 'document';
            break;
        default:
            dispatch(importRowsFailure(formatMessage({id : 'Invalid type of rows.'})));
            return;
    }

    const requestBody = JSON.stringify({
        typeRow: typeRowString,
        data: data,
    });

    const requestOptions = {
        method: 'POST',
        body: requestBody,
        headers: getState().login.authorizationHeader,
      };

      return fetch(importRowsUrl, requestOptions)
      .then(checkStatus)
      .then((response) => {
          dispatch(importRowsSuccess(response));
      })
      .catch((error) => {
          dispatch(importRowsFailure(error.message));
      })
};