import fetch from 'isomorphic-fetch';
import {findForCarouselUrl} from '../conf/Config';

export const FETCH_PARTNERS_FC = 'FETCH_PARTNERS_FC';
export const FETCH_PARTNERS_FC_SUCCESS = 'FETCH_PARTNERS_FC_SUCCESS';
export const FETCH_PARTNERS_FC_FAILURE = 'FETCH_PARTNERS_FC_FAILURE';

export const fetchPartnersForCarousel = () => {
  return {
    type: FETCH_PARTNERS_FC,
    partners: undefined
  };
};

export const fetchPartnersForCarouselSuccess = (entry) => {
  return {
    type: FETCH_PARTNERS_FC_SUCCESS,
    entry: entry
  };
};

export const fetchPartnersForCarouselFailure = (error) => {
  return {
    type: FETCH_PARTNERS_FC_FAILURE,
    error: error
  };
};

export function loadPartnersForCarousel() {
  return function (dispatch) {
    dispatch(fetchPartnersForCarousel());

    return fetch(findForCarouselUrl)
    .then((response) => {
      if (response.status >= 400) {
        let errorMessage = 'Fetching ' + findForCarouselUrl + ' status: ' + response.status;
        dispatch(fetchPartnersForCarouselFailure(errorMessage));
        throw new Error(errorMessage);
      }
      return response.text();
    })
    .then(text => dispatch(fetchPartnersForCarouselSuccess(JSON.parse(text))))/*
    .catch(error => dispatch(fetchPartnersForCarouselFailure(error)))*/;
  };
}
