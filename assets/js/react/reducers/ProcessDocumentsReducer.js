import {
  POST_PROCESS_DOCUMENTS,
  POST_PROCESS_DOCUMENTS_FAILURE,
  POST_PROCESS_DOCUMENTS_SUCCESS,
} from '../actions/ProcessDocuments';

const initialState = {
  error: null,
  isLoading: false,
  success: null,
};

const processDocuments = (state = initialState, action) => {
  switch (action.type) {
    case POST_PROCESS_DOCUMENTS:
      return {
        ...initialState,
        isLoading: true,
      };
    case POST_PROCESS_DOCUMENTS_SUCCESS:
      return {
        ...initialState,
        success: true,
      };
    case POST_PROCESS_DOCUMENTS_FAILURE:
      return {
        ...initialState,
        success: false,
        error: action.error,
      };
    default:
      return state;
  }
};

export default processDocuments;
