import {
  POST_DOCUMENT,
  POST_DOCUMENT_FAILURE,
  POST_DOCUMENT_SUCCESS,
} from '../actions/Document';

//
//
// D E F A U L T - S T A T E
//
//

const initialState = {
  errorMessages: [],
  isLoading: false,
};

//
//
// R E D U C E R
//
//
const document = (state = initialState, action) => {
  switch (action.type) {
    case POST_DOCUMENT:
      return { ...state, isLoading: true, errorMessages: [] };
    case POST_DOCUMENT_SUCCESS:
      return {
        ...state,
        isLoading: false,
        errorMessages: [],
      };
    case POST_DOCUMENT_FAILURE:
      return {
        ...state,
        isLoading: false,
        errorMessages: action.errorMessages,
      };
    default:
      return state;
  }
};

export default document;
