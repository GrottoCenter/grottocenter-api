import fetch from 'isomorphic-fetch';
import {dynamicNumbersUrl} from '../conf/Config';

//
//
// A C T I O N S
//
//

export const INIT_DYNNB_FETCHER = 'INIT_DYNNB_FETCHER';
export const FETCH_DYNNB = 'FETCH_DYNNB';
export const FETCH_DYNNB_SUCCESS = 'FETCH_DYNNB_SUCCESS';
export const FETCH_DYNNB_FAILURE = 'FETCH_DYNNB_FAILURE';
export const LOAD_DYNNB = 'LOAD_DYNNB';

//
//
// A C T I O N S - C R E A T O R S
//
//

export const initDynamicNumberFetcher = (numberType) => {
  return {
    type: INIT_DYNNB_FETCHER,
    numberType: numberType
  };
};

export const fetchDynamicNumber = (numberType) => {
  return {
    type: FETCH_DYNNB,
    numberType: numberType
  };
};

export const fetchDynamicNumberSuccess = (numberType, number) => {
  return {
    type: FETCH_DYNNB_SUCCESS,
    numberType: numberType,
    number: number
  };
};

export const fetchDynamicNumberFailure = (numberType, error) => {
  return {
    type: FETCH_DYNNB_FAILURE,
    numberType: numberType,
    error: error
  };
};

//
//
// T H U N K S
//
//

export function loadDynamicNumber(numberType) {
  return function (dispatch) {
    dispatch(initDynamicNumberFetcher(numberType));
    dispatch(fetchDynamicNumber(numberType));

    let url = dynamicNumbersUrl[numberType];
    return fetch(url)
    .then((response) => {
      if (response.status >= 400) {
        throw new Error('Bad response from server'); // TODO Add better error management
      }
      return response.text();
    })
    .then(text => dispatch(fetchDynamicNumberSuccess(numberType, text)))
    .catch(error => {
      dispatch(fetchDynamicNumberFailure(numberType, error));
    });
  };
}
