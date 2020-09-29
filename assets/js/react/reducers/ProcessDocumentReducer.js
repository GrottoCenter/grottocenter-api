import {
  POST_PROCESS_DOCUMENTS,
  POST_PROCESS_DOCUMENTS_FAILURE,
  POST_PROCESS_DOCUMENTS_SUCCESS,
} from '../actions/ProcessDocuments';

const initialState = {
  errorMessage: '',
  isLoading: false,
  success: null,
};

const processDocument = (state = initialState, action) => {
  switch (action.type) {
    case POST_PROCESS_DOCUMENTS:
      return {
        ...initialState,
        isLoading: true,
      };
    case POST_PROCESS_DOCUMENTS_SUCCESS:
      return {
        ...initialState,
        isLoading: false,
        success: true,
      };
    case POST_PROCESS_DOCUMENTS_FAILURE:
      return {
        ...initialState,
        success: false,
        errorMessages: action.errorMessage,
      };
    default:
      return state;
  }
};

export default processDocument;
