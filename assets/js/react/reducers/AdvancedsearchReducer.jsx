import {
  FETCH_ADVANCEDSEARCH_STARTED,
  FETCH_ADVANCEDSEARCH_SUCCESS,
  FETCH_ADVANCEDSEARCH_FAILURE,

  FETCH_NEXT_ADVANCEDSEARCH_STARTED,
  FETCH_NEXT_ADVANCEDSEARCH_SUCCESS,
  FETCH_NEXT_ADVANCEDSEARCH_FAILURE,

  FETCH_FULL_ADVANCEDSEARCH_STARTED,
  FETCH_FULL_ADVANCEDSEARCH_SUCCESS,
  FETCH_FULL_ADVANCEDSEARCH_FAILURE,

  RESET_ADVANCEDSEARCH_RESULTS,
} from '../actions/Advancedsearch';

//
//
// D E F A U L T - S T A T E
//
//

const initialState = {
  totalNbResults: 0, // total number of results for the search
  results: undefined, // search results
  errors: undefined, // fetch errors
  fullResults: [], // All search results
  isLoading: false,
  isLoadingFullData: false,
  wantToDownloadCSV: false, // specify if a download of the full data was asked by the user
  searchCriterias: {
    from: 0,
    size: 10,
    resourceType: '', // results type (one of: entries, groups, massifs)
  },
};

//
//
// R E D U C E R
//
//

const advancedsearch = (state = initialState, action) => {
  switch (action.type) {
    // Search "from nothing"
    case FETCH_ADVANCEDSEARCH_STARTED: {
      return Object.assign({}, state, {
        errors: undefined,
        isLoading: true,
        results: undefined,
        searchCriterias: {
          ...action.criterias,
        },
        wantToDownloadCSV: false, // Reset the need of downloading as CSV because it's a new search
      });
    }
    case FETCH_ADVANCEDSEARCH_SUCCESS: {
      let mergedResults = [];
      if (state.results) {
        mergedResults = mergedResults.concat(state.results);
      }
      mergedResults = mergedResults.concat(action.results);

      // Remove duplicates
      mergedResults = [...new Set(mergedResults)];

      return Object.assign({}, state, {
        totalNbResults: action.totalNbResults,
        results: mergedResults,
        isLoading: false,
      });
    }
    case FETCH_ADVANCEDSEARCH_FAILURE: {
      return Object.assign({}, state, {
        error: action.error,
        isLoading: false,
      });
    }

    // Get next page of results
    case FETCH_NEXT_ADVANCEDSEARCH_STARTED: {
      return Object.assign({}, state, {
        errors: undefined,
        isLoading: true,
        searchCriterias: {
          ...state.searchCriterias,
          ...action.criterias,
        },
      });
    }
    case FETCH_NEXT_ADVANCEDSEARCH_SUCCESS: {
      let mergedResults = (state.results ? state.results : []);
      mergedResults = mergedResults.concat(action.results);
      // Remove duplicates
      mergedResults = [...new Set(mergedResults)];

      return Object.assign({}, state, {
        results: mergedResults,
        isLoading: false,
      });
    }
    case FETCH_NEXT_ADVANCEDSEARCH_FAILURE: {
      return Object.assign({}, state, {
        error: action.error,
        isLoading: false,
      });
    }

    // Get all results
    case FETCH_FULL_ADVANCEDSEARCH_STARTED: {
      return Object.assign({}, state, {
        errors: undefined,
        isLoadingFullData: true,
        searchCriterias: {
          ...state.searchCriterias,
          ...action.criterias,
        },
      });
    }
    case FETCH_FULL_ADVANCEDSEARCH_SUCCESS: {
      // Remove duplicates
      return Object.assign({}, state, {
        fullResults: [...new Set(action.results)],
        isLoadingFullData: false,
        wantToDownloadCSV: true,
      });
    }
    case FETCH_FULL_ADVANCEDSEARCH_FAILURE: {
      return Object.assign({}, state, {
        error: action.error,
        isLoadingFullData: false,
        wantToDownloadCSV: false,
      });
    }

    // Reset search
    case RESET_ADVANCEDSEARCH_RESULTS: {
      return initialState;
    }
    default:
      return state;
  }
};

export default advancedsearch;
