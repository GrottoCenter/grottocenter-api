import {
  FETCH_DOCUMENT_DETAILS,
  FETCH_DOCUMENT_DETAILS_FAILURE,
  FETCH_DOCUMENT_DETAILS_SUCCESS,
} from '../actions/DocumentDetails';

const initialState = {
  error: null,
  isLoading: false,
  details: {},
};

const documentDetails = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_DOCUMENT_DETAILS:
      return {
        ...initialState,
        isLoading: true,
      };
    case FETCH_DOCUMENT_DETAILS_FAILURE:
      return {
        ...state,
        isLoading: false,
        error: action.error,
      };
    case FETCH_DOCUMENT_DETAILS_SUCCESS:
      return {
        ...state,
        isLoading: false,
        details: action.data,
      };
    default:
      return state;
  }
};

export default documentDetails;
