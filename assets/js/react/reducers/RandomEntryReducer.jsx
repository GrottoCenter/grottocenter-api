import {FETCH_RANDOMENTRY, FETCH_RANDOMENTRY_SUCCESS, FETCH_RANDOMENTRY_FAILURE} from './../actions/RandomEntry';

const initialState = {
  isFetching: false, // show loading spinner
  entry: undefined   // random entry
}

export const randomEntry = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_RANDOMENTRY:
      return Object.assign({}, state, {
        isFetching: true
      });
    case FETCH_RANDOMENTRY_SUCCESS:
      return Object.assign({}, state, {
        isFetching: false,
        entry: action.entry
      });
    case FETCH_RANDOMENTRY_FAILURE:
      return Object.assign({}, state, {
        isFetching: false,
        error: action.error
      });
    default:
      return state;
  }
};
