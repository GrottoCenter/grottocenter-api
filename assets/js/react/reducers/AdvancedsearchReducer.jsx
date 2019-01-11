import {
  RESET_ADVANCEDSEARCH,
  FETCH_ADVANCEDSEARCH_SUCCESS,
  FETCH_ADVANCEDSEARCH_FAILURE,
} from '../actions/Advancedsearch';

//
//
// D E F A U L T - S T A T E
//
//

const initialState = {
  results: [], // search results
  errors: undefined, // fetch errors
  entry: undefined, // marker entry
};

//
//
// R E D U C E R
//
//

const advancedsearch = (state = initialState, action) => {
  switch (action.type) {
    case RESET_ADVANCEDSEARCH:
      return Object.assign({}, state, {
        results: [],
        errors: undefined,
      });
    case FETCH_ADVANCEDSEARCH_SUCCESS:
      return Object.assign({}, state, {
        results: action.results,
      });
    case FETCH_ADVANCEDSEARCH_FAILURE:
      return Object.assign({}, state, {
        error: action.error,
      });
    default:
      return state;
  }
};

export default advancedsearch;
