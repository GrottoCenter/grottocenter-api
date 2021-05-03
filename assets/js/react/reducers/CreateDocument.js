import {
  POST_DOCUMENT,
  POST_DOCUMENT_SUCCESS,
  POST_DOCUMENT_FAILURE,
} from '../actions/CreateDocument';

const initialState = {
  error: null,
  loading: false,
  document: null,
};

const createDocument = (state = initialState, action) => {
  switch (action.type) {
    case POST_DOCUMENT:
      return {
        ...initialState,
        loading: true,
      };
    case POST_DOCUMENT_SUCCESS:
      return {
        ...initialState,
        loading: false,
        document: action.document,
      };
    case POST_DOCUMENT_FAILURE:
      return {
        ...initialState,
        error: action.error,
      };
    default:
      return state;
  }
};

export default createDocument;
