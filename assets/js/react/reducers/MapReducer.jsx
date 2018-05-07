import {
  FETCH_MAP_ITEMS_SUCCESS,
  FETCH_MAP_ITEMS_FAILURE,
  CHANGE_LOCATION,
  CHANGE_ZOOM,
  FOCUS_ON_LOCATION
} from './../actions/Map';
import {
  defaultCoord,
  defaultZoom,
  focusZoom
} from '../conf/Config';

const initialState = {
  visibleEntries: undefined,
  location: defaultCoord,
  zoom: defaultZoom,
  errors: undefined
};

export const map = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_MAP_ITEMS_SUCCESS:
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
    case FOCUS_ON_LOCATION:
      return Object.assign({}, state, {
        location: action.location,
        zoom: focusZoom
      });
    default:
      return state;
  }
};
