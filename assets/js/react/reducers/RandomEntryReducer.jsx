import {
  FETCH_RANDOMENTRY,
  FETCH_RANDOMENTRY_SUCCESS,
  FETCH_RANDOMENTRY_FAILURE,
} from '../actions/RandomEntry';

//
//
// D E F A U L T - S T A T E
//
//

const initialState = {
  isFetching: false, // show loading spinner
  entry: undefined, // random entry
};

//
//
// R E D U C E R
//
//

const randomEntry = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_RANDOMENTRY:
      return Object.assign({}, state, {
        isFetching: true,
      });
    case FETCH_RANDOMENTRY_SUCCESS:
      return Object.assign({}, state, {
        isFetching: false,
        entry: action.entry,
      });
    case FETCH_RANDOMENTRY_FAILURE:
      return Object.assign({}, state, {
        isFetching: false,
        error: action.error,
      });
    default:
      return state;
  }
};

export default randomEntry;
