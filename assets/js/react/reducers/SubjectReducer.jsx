import {
  FETCH_SUBJECTS,
  FETCH_SUBJECTS_FAILURE,
  FETCH_SUBJECTS_SUCCESS,
} from '../actions/Subject';

//
//
// D E F A U L T - S T A T E
//
//

const initialState = {
  subjects: [],
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
      return { ...state, isFetching: true };

    case FETCH_SUBJECTS_SUCCESS:
      return {
        ...state,
        subjects: action.subjects,
        isFetching: false,
      };

    case FETCH_SUBJECTS_FAILURE:
      return { ...state, error: action.error, isFetching: false };

    default:
      return state;
  }
};

export default subject;
