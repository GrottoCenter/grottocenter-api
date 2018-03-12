import fetch from 'isomorphic-fetch';
import {findMapBoundsUrl, defaultCoord, defaultZoom} from '../conf/Config';

export const RESET_MAP_ITEMS = 'RESET_MAP_ITEMS';
export const FETCH_MAP_ITEMS_SUCCESS = 'FETCH_MAP_ITEMS_SUCCESS';
export const FETCH_MAP_ITEMS_FAILURE = 'FETCH_MAP_ITEMS_FAILURE';
export const CHANGE_LOCATION = 'CHANGE_LOCATION';
export const CHANGE_ZOOM = 'CHANGE_ZOOM';

export const resetMapItems = () => {
  return {
    type: RESET_MAP_ITEMS,
    results: {},
    location: defaultCoord,
    zoom: defaultZoom,
    error: undefined
  }
};

export const fetchMapItemsSuccess = (results) => {
  return {
    type: FETCH_MAP_ITEMS_SUCCESS,
    results
  }
};

export const fetchMapItemsFailure = (error) => {
  return {
    type: FETCH_MAP_ITEMS_FAILURE,
    error
  }
};

export function fetchMapItemsResult(criteria) {
  return function (dispatch) {
    let completeUrl = findMapBoundsUrl;
    if (criteria) {
      completeUrl += '?' + Object.keys(criteria).map(k => k + '=' + encodeURIComponent(criteria[k])).join('&');
    }

    return fetch(completeUrl)
    .then((response) => {
      if (response.status >= 400) {
        let errorMessage = 'Fetching ' + completeUrl + ' status: ' + response.status;
        dispatch(fetchMapItemsFailure(errorMessage));
        throw new Error(errorMessage);
      }
      return response.text();
    })
    .then(text => dispatch(fetchMapItemsSuccess(JSON.parse(text))))/*
    .catch(error => dispatch(fetchRandomEntryFailure(error)))*/;
  };
}

export const changeLocation = (location) => {
  return {
    type: CHANGE_LOCATION,
    location
  }
};

export const changeZoom = (zoom) => {
  return {
    type: CHANGE_ZOOM,
    zoom
  }
};
