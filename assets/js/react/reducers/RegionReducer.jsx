import {
  REGIONS_SEARCH,
  REGIONS_SEARCH_FAILURE,
  REGIONS_SEARCH_SUCCESS,
  RESET_REGIONS_SEARCH,
} from '../actions/Region';

//
//
// D E F A U L T - S T A T E
//
//

const initialState = {
  bbsRegionsByName: [],
  isFetching: false,
  errors: undefined,
};

//
//
// R E D U C E R
//
//
const region = (state = initialState, action) => {
  switch (action.type) {
    case REGIONS_SEARCH:
      return { ...state, isFetching: true };

    case REGIONS_SEARCH_SUCCESS:
      return {
        ...state,
        bbsRegionsByName: action.regions,
        isFetching: false,
      };

    case REGIONS_SEARCH_FAILURE:
      return { ...state, error: action.error, isFetching: false };

    case RESET_REGIONS_SEARCH:
      return { ...state, bbsRegionsByName: [] };

    default:
      return state;
  }
};

export default region;
