import {
  POST_ENTRY,
  POST_ENTRY_FAILURE,
  POST_ENTRY_SUCCESS,
} from '../actions/CreateEntry';

const initialState = {
  error: null,
  loading: false,
  entry: null,
};

const createEntry = (state = initialState, action) => {
  switch (action.type) {
    case POST_ENTRY:
      return {
        ...initialState,
        loading: true,
      };
    case POST_ENTRY_SUCCESS:
      return {
        ...initialState,
        loading: false,
        entry: action.entry,
      };
    case POST_ENTRY_FAILURE:
      return {
        ...initialState,
        error: action.error,
      };
    default:
      return state;
  }
};

export default createEntry;
