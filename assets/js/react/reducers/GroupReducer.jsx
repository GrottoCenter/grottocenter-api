import {
  FETCH_GROUP,
  FETCH_GROUP_FAILURE,
  FETCH_GROUP_SUCCESS,
} from '../actions/Group';

const initialState = {
  group: undefined, // group fetched
  isFetching: false, // show loading spinner
  errors: undefined, // fetch errors
};

const group = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_GROUP:
      return {
        ...initialState,
        isFetching: true,
      };
    case FETCH_GROUP_SUCCESS:
      return {
        ...initialState,
        group: action.group,
      };
    case FETCH_GROUP_FAILURE:
      return {
        ...initialState,
        error: action.error,
      };
    default:
      return state;
  }
};

export default group;
