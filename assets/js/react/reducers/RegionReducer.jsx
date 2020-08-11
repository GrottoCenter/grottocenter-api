import {
  FETCH_BBS_REGIONS_BY_NAME,
  FETCH_BBS_REGIONS_BY_NAME_FAILURE,
  FETCH_BBS_REGIONS_BY_NAME_SUCCESS,
  RESET_BBS_REGIONS_BY_NAME,
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
    case FETCH_BBS_REGIONS_BY_NAME:
      return { ...state, isFetching: true };

    case FETCH_BBS_REGIONS_BY_NAME_SUCCESS:
      return {
        ...state,
        bbsRegionsByName: action.regions,
        isFetching: false,
      };

    case FETCH_BBS_REGIONS_BY_NAME_FAILURE:
      return { ...state, error: action.error, isFetching: false };

    case RESET_BBS_REGIONS_BY_NAME:
      return { ...state, bbsRegionsByName: [] };

    default:
      return state;
  }
};

export default region;
