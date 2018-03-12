import {
  RESET_QUICKSEARCH,
  FETCH_QUICKSEARCH_SUCCESS,
  FETCH_QUICKSEARCH_FAILURE,
  SET_CURRENT_ENTRY
} from './../actions/Quicksearch';

const initialState = {
  results: undefined,  // search results
  errors: undefined,   // fetch errors
  entry: undefined     // marker entry
}

export const quicksearch = (state = initialState, action) => {
  switch (action.type) {
    case RESET_QUICKSEARCH:
      return Object.assign({}, state, {
        results: {},
        errors: undefined
      });
    case FETCH_QUICKSEARCH_SUCCESS:
      return Object.assign({}, state, {
        results: action.results
      });
    case FETCH_QUICKSEARCH_FAILURE:
      return Object.assign({}, state, {
        error: action.error
      });
    case SET_CURRENT_ENTRY:
      return Object.assign({}, state, {
        entry: action.entry
      });
    default:
      return state;
  }
};
