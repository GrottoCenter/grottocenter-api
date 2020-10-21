import { isNil } from 'ramda';
import { CLEAN_ERROR } from '../actions/Error';

const initialState = {
  error: null,
};

const reducer = (state = initialState, { error, type }) => {
  if (!isNil(error)) {
    return {
      error,
    };
  }
  if (type === CLEAN_ERROR) {
    return initialState;
  }
  return state;
};

export default reducer;
