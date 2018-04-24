import {
  FETCH_MAP_ITEMS_SUCCESS,
  FETCH_MAP_ITEMS_FAILURE,
  CHANGE_LOCATION,
  CHANGE_ZOOM
} from './../actions/Map';

const initialState = {
  visibleEntries: undefined,
  location: undefined,
  zoom: undefined,
  errors: undefined
}

export const map = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_MAP_ITEMS_SUCCESS:
      console.log('FETCH_MAP_ITEMS_SUCCESS');
      return Object.assign({}, state, {
        visibleEntries: action.results
      });
    case FETCH_MAP_ITEMS_FAILURE:
      return Object.assign({}, state, {
        error: action.error
      });
    case CHANGE_LOCATION:
      return Object.assign({}, state, {
        location: action.location
      });
    case CHANGE_ZOOM:
      return Object.assign({}, state, {
        zoom: action.zoom
      });
    default:
      return state;
  }
};
