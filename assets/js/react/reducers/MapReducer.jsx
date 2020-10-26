import {
  FETCH_MAP_ITEMS_SUCCESS,
  FETCH_MAP_ITEMS_FAILURE,
  CHANGE_LOCATION,
  CHANGE_ZOOM,
  FOCUS_ON_LOCATION,
} from '../actions/Map';
import { defaultCoord, defaultZoom, focusZoom } from '../conf/Config';

const initialState = {
  mapData: undefined,
  location: defaultCoord,
  zoom: defaultZoom,
  errors: undefined,
};

//
//
// D E F A U L T - S T A T E
//
//

//
//
// R E D U C E R
//
//

const map = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_MAP_ITEMS_SUCCESS:
      return { ...state, mapData: action.results };
    case FETCH_MAP_ITEMS_FAILURE:
      return { ...state, error: action.error };
    case CHANGE_LOCATION:
      return { ...state, location: action.location };
    case CHANGE_ZOOM:
      return { ...state, zoom: action.zoom };
    case FOCUS_ON_LOCATION:
      return { ...state, location: action.location, zoom: focusZoom };
    default:
      return state;
  }
};

export default map;
