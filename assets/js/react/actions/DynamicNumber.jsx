import fetch from 'isomorphic-fetch';
import { dynamicNumbersUrl } from '../conf/Config';

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

export const initDynamicNumberFetcher = (numberType) => ({
  type: INIT_DYNNB_FETCHER,
  numberType,
});

export const fetchDynamicNumber = (numberType) => ({
  type: FETCH_DYNNB,
  numberType,
});

export const fetchDynamicNumberSuccess = (numberType, number) => ({
  type: FETCH_DYNNB_SUCCESS,
  numberType,
  number,
});

export const fetchDynamicNumberFailure = (numberType, error) => ({
  type: FETCH_DYNNB_FAILURE,
  numberType,
  error,
});

//
//
// T H U N K S
//
//

export function loadDynamicNumber(numberType) {
  return (dispatch) => {
    dispatch(initDynamicNumberFetcher(numberType));
    dispatch(fetchDynamicNumber(numberType));

    const url = dynamicNumbersUrl[numberType];
    return fetch(url)
      .then((response) => {
        if (response.status >= 400) {
          throw new Error('Bad response from server'); // TODO Add better error management
        }
        return response.text();
      })
      .then((text) => dispatch(fetchDynamicNumberSuccess(numberType, text)))
      .catch((error) => {
        dispatch(fetchDynamicNumberFailure(numberType, error));
      });
  };
}
