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
  error: null,
};

//
//
// R E D U C E R
//
//

const randomEntry = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_RANDOMENTRY:
      return { ...initialState, isFetching: true };
    case FETCH_RANDOMENTRY_SUCCESS:
      return { ...initialState, entry: action.entry };
    case FETCH_RANDOMENTRY_FAILURE:
      return { ...initialState, error: action.error };
    default:
      return state;
  }
};

export default randomEntry;
