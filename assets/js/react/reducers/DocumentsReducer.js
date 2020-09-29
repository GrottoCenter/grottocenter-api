import {
  FETCH_DOCUMENTS,
  FETCH_DOCUMENTS_SUCCESS,
  FETCH_DOCUMENTS_FAILURE,
} from '../actions/Documents';

const initialState = {
  errorMessages: [],
  isLoading: false,
  data: {
    documents: [],
    totalCount: 0,
  },
};

const documents = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_DOCUMENTS:
      return {
        ...state,
        isLoading: true,
        errorMessages: [],
      };
    case FETCH_DOCUMENTS_SUCCESS:
      return {
        ...initialState,
        data: action.documents,
        totalCount: action.totalCount,
      };
    case FETCH_DOCUMENTS_FAILURE:
      return {
        ...state,
        isLoading: false,
        errorMessages: action.errorMessages,
      };
    default:
      return state;
  }
};

export default documents;
