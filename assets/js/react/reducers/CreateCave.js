import {
  POST_CAVE,
  POST_CAVE_FAILURE,
  POST_CAVE_SUCCESS,
} from '../actions/CreateCave';

const initialState = {
  error: null,
  loading: false,
  cave: null,
};

const createCave = (state = initialState, action) => {
  switch (action.type) {
    case POST_CAVE:
      return {
        ...initialState,
        loading: true,
      };
    case POST_CAVE_SUCCESS:
      return {
        ...initialState,
        loading: false,
        cave: action.cave,
      };
    case POST_CAVE_FAILURE:
      return {
        ...initialState,
        error: action.error,
      };
    default:
      return state;
  }
};

export default createCave;
