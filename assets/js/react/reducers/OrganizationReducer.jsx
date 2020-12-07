import {
  FETCH_ORGANIZATION,
  FETCH_ORGANIZATION_FAILURE,
  FETCH_ORGANIZATION_SUCCESS,
} from '../actions/Organization';

const initialState = {
  organization: undefined,
  isFetching: false,
  error: null,
};

const organization = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_ORGANIZATION:
      return {
        ...initialState,
        isFetching: true,
      };
    case FETCH_ORGANIZATION_SUCCESS:
      return {
        ...initialState,
        error: null,
        isFetching: false,
        organization: action.organization,
      };
    case FETCH_ORGANIZATION_FAILURE:
      return {
        ...initialState,
        error: action.error,
        isFetching: false,
      };
    default:
      return state;
  }
};

export default organization;
