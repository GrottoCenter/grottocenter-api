import {
  POST_CAVER_GROUPS,
  POST_CAVER_GROUPS_FAILURE,
  POST_CAVER_GROUPS_SUCCESS,
} from '../actions/Caver';

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
const caver = (state = initialState, action) => {
  switch (action.type) {
    case POST_CAVER_GROUPS:
      return {
        ...state,
        isLoading: true,
        errorMessages: [],
        latestHttpCode: undefined,
      };
    case POST_CAVER_GROUPS_SUCCESS:
      return {
        ...state,
        isLoading: false,
        errorMessages: [],
        latestHttpCode: action.httpCode,
      };
    case POST_CAVER_GROUPS_FAILURE:
      return {
        ...state,
        isLoading: false,
        errorMessages: action.errorMessages,
        latestHttpCode: action.httpCode,
      };
    default:
      return state;
  }
};

export default caver;
