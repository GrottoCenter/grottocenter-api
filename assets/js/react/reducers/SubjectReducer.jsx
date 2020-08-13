import {
  FETCH_SUBJECTS,
  FETCH_SUBJECTS_FAILURE,
  FETCH_SUBJECTS_SUCCESS,
  SUBJECTS_SEARCH,
  SUBJECTS_SEARCH_FAILURE,
  SUBJECTS_SEARCH_SUCCESS,
  RESET_SUBJECTS_SEARCH,
} from '../actions/Subject';

//
//
// D E F A U L T - S T A T E
//
//

const initialState = {
  subjects: [],
  searchedSubjects: [],
  isFetching: false,
  errors: undefined,
};

//
//
// R E D U C E R
//
//
const subject = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_SUBJECTS:
    case SUBJECTS_SEARCH:
      return { ...state, isFetching: true };

    case FETCH_SUBJECTS_SUCCESS:
      return {
        ...state,
        subjects: action.subjects,
        isFetching: false,
      };

    case SUBJECTS_SEARCH_SUCCESS:
      return {
        ...state,
        searchedSubjects: action.subjects,
        isFetching: false,
      };

    case FETCH_SUBJECTS_FAILURE:
    case SUBJECTS_SEARCH_FAILURE:
      return { ...state, error: action.error, isFetching: false };

    case RESET_SUBJECTS_SEARCH:
      return { ...state, searchedSubjects: [] };

    default:
      return state;
  }
};

export default subject;
