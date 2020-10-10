import {
  POST_DOCUMENT,
  POST_DOCUMENT_FAILURE,
  POST_DOCUMENT_SUCCESS,
  RESET_API_MESSAGES,
} from '../actions/Document';

//
//
// D E F A U L T - S T A T E
//
//

const initialState = {
  errorMessages: [],
  isLoading: false,
  latestHttpCode: undefined,
};

//
//
// R E D U C E R
//
//
const document = (state = initialState, action) => {
  switch (action.type) {
    case POST_DOCUMENT:
      return {
        ...state,
        isLoading: true,
        errorMessages: [],
        latestHttpCode: undefined,
      };
    case POST_DOCUMENT_SUCCESS:
      return {
        ...state,
        isLoading: false,
        errorMessages: [],
        latestHttpCode: action.httpCode,
      };
    case POST_DOCUMENT_FAILURE:
      return {
        ...state,
        isLoading: false,
        errorMessages: action.errorMessages,
        latestHttpCode: action.httpCode,
      };
    case RESET_API_MESSAGES:
      return {
        ...state,
        errorMessages: [],
        latestHttpCode: undefined,
      };
    default:
      return state;
  }
};

export default document;
