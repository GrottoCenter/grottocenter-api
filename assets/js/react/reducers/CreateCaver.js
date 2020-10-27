import {
  POST_CAVER,
  POST_CAVER_FAILURE,
  POST_CAVER_SUCCESS,
} from '../actions/CreateCaver';

const initialState = {
  error: null,
  isLoading: false,
  caver: null,
};

const createCaver = (state = initialState, action) => {
  switch (action.type) {
    case POST_CAVER:
      return {
        ...initialState,
        isLoading: true,
      };
    case POST_CAVER_SUCCESS:
      return {
        ...initialState,
        isLoading: false,
        caver: action.caver,
      };
    case POST_CAVER_FAILURE:
      return {
        ...initialState,
        error: action.error,
      };
    default:
      return state;
  }
};

export default createCaver;
