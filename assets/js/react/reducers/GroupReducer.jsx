import { FETCH_GROUP, FETCH_GROUP_FAILURE, FETCH_GROUP_SUCCESS } from '../actions/Group';

//
//
// D E F A U L T - S T A T E
//
//

const initialState = {
  group: undefined, // group fetched
  isFetching: false, // show loading spinner
  errors: undefined, // fetch errors
};

//
//
// R E D U C E R
//
//
const group = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_GROUP:
      return Object.assign({}, state, {
        group: action.group,
        isFetching: true,
      });
    case FETCH_GROUP_SUCCESS:
      return Object.assign({}, state, {
        group: action.group,
        isFetching: false,
      });
    case FETCH_GROUP_FAILURE:
      return Object.assign({}, state, {
        error: action.error,
        isFetching: false,
      });
    default:
      return state;
  }
};

export default group;
