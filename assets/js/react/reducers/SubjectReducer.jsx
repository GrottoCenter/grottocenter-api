import {
  FETCH_SUBJECTS,
  FETCH_SUBJECTS_FAILURE,
  FETCH_SUBJECTS_SUCCESS,
  FETCH_SUBJECTS_BY_NAME,
  FETCH_SUBJECTS_BY_NAME_FAILURE,
  FETCH_SUBJECTS_BY_NAME_SUCCESS,
  RESET_SUBJECTS_BY_NAME,
} from '../actions/Subject';

//
//
// D E F A U L T - S T A T E
//
//

const initialState = {
  subjects: [],
  subjectsByName: [],
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
    case FETCH_SUBJECTS_BY_NAME:
      return { ...state, isFetching: true };

    case FETCH_SUBJECTS_SUCCESS:
      return {
        ...state,
        subjects: action.subjects,
        isFetching: false,
      };

    case FETCH_SUBJECTS_BY_NAME_SUCCESS:
      return {
        ...state,
        subjectsByName: action.subjects,
        isFetching: false,
      };

    case FETCH_SUBJECTS_FAILURE:
    case FETCH_SUBJECTS_BY_NAME_FAILURE:
      return { ...state, error: action.error, isFetching: false };

    case RESET_SUBJECTS_BY_NAME:
      return { ...state, subjectsByName: [] };

    default:
      return state;
  }
};

export default subject;
