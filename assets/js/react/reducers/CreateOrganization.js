import {
  POST_ORGANIZATION,
  POST_ORGANIZATION_FAILURE,
  POST_ORGANIZATION_SUCCESS,
} from '../actions/CreateOrganization';

const initialState = {
  error: null,
  isLoading: false,
  organization: null,
};

const createOrganization = (state = initialState, action) => {
  switch (action.type) {
    case POST_ORGANIZATION:
      return {
        ...initialState,
        isLoading: true,
      };
    case POST_ORGANIZATION_SUCCESS:
      return {
        ...initialState,
        isLoading: false,
        organization: action.organization,
      };
    case POST_ORGANIZATION_FAILURE:
      return {
        ...initialState,
        error: action.error,
      };
    default:
      return state;
  }
};

export default createOrganization;
