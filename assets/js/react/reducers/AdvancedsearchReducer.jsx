import {
  FETCH_ADVANCEDSEARCH_STARTED,
  FETCH_ADVANCEDSEARCH_SUCCESS,
  FETCH_ADVANCEDSEARCH_FAILURE,
  RESET_ADVANCEDSEARCH_RESULTS,
} from '../actions/Advancedsearch';

//
//
// D E F A U L T - S T A T E
//
//

const initialState = {
  results: undefined, // search results
  resultType: '', // results type (one of: enty, group, massif)
  errors: undefined, // fetch errors
  isLoading: false,
};

//
//
// R E D U C E R
//
//

const advancedsearch = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_ADVANCEDSEARCH_STARTED:
      return Object.assign({}, state, {
        errors: undefined,
        isLoading: true,
        results: [],
      });
    case FETCH_ADVANCEDSEARCH_SUCCESS:
      return Object.assign({}, state, {
        results: action.results,
        isLoading: false,
      });
    case FETCH_ADVANCEDSEARCH_FAILURE:
      return Object.assign({}, state, {
        error: action.error,
        isLoading: false,
      });
    case RESET_ADVANCEDSEARCH_RESULTS:
      return Object.assign({}, state, {
        isLoading: false,
        results: undefined,
      });
    default:
      return state;
  }
};

export default advancedsearch;
