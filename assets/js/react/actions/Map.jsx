import fetch from 'isomorphic-fetch';
import { findMapBoundsUrl } from '../conf/Config';

//
//
// A C T I O N S
//
//

export const FETCH_MAP_ITEMS_SUCCESS = 'FETCH_MAP_ITEMS_SUCCESS';
export const FETCH_MAP_ITEMS_FAILURE = 'FETCH_MAP_ITEMS_FAILURE';
export const CHANGE_LOCATION = 'CHANGE_LOCATION';
export const CHANGE_ZOOM = 'CHANGE_ZOOM';
export const FOCUS_ON_LOCATION = 'FOCUS_ON_LOCATION';

//
//
// A C T I O N S - C R E A T O R S
//
//

export const fetchMapItemsSuccess = results => ({
  type: FETCH_MAP_ITEMS_SUCCESS,
  results,
});

export const fetchMapItemsFailure = error => ({
  type: FETCH_MAP_ITEMS_FAILURE,
  error,
});

export const changeLocation = location => ({
  type: CHANGE_LOCATION,
  location,
});

//
//
// T H U N K S
//
//

export function fetchMapItemsResult(criteria) {
  const thunkToDebounce = function (dispatch) {
    let completeUrl = findMapBoundsUrl;
    if (criteria) {
      completeUrl += `?${Object.keys(criteria).map(k => `${k}=${encodeURIComponent(criteria[k])}`).join('&')}`;
    }

    return fetch(completeUrl)
      .then((response) => {
        if (response.status >= 400) {
          const errorMessage = `Fetching ${completeUrl} status: ${response.status}`;
          dispatch(fetchMapItemsFailure(errorMessage));
          throw new Error(errorMessage);
        }
        return response.text();
      })
      .then(text => dispatch(fetchMapItemsSuccess(JSON.parse(text))))
      .catch((error) => {
        // dispatch(fetchRandomEntryFailure(error)
        console.log(error);
      });
  };

  thunkToDebounce.meta = {
    debounce: {
      time: 1000,
      key: 'fetchMapItemsResult',
    },
  };

  return thunkToDebounce;
}


export const changeZoom = zoom => ({
  type: CHANGE_ZOOM,
  zoom,
});

export const focusOnLocation = location => ({
  type: FOCUS_ON_LOCATION,
  location,
});
