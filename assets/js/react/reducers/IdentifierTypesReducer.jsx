import {
  FETCH_IDENTIFIER_TYPES,
  FETCH_IDENTIFIER_TYPES_FAILURE,
  FETCH_IDENTIFIER_TYPES_SUCCESS,
} from '../actions/IdentifierType';

//
//
// D E F A U L T - S T A T E
//
//

const initialState = {
  identifierTypes: [],
  isFetching: false,
  errors: undefined,
};

//
//
// R E D U C E R
//
//
const identifierType = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_IDENTIFIER_TYPES:
      return { ...state, isFetching: true };

    case FETCH_IDENTIFIER_TYPES_SUCCESS:
      return {
        ...state,
        identifierTypes: action.identifierTypes,
        isFetching: false,
      };

    case FETCH_IDENTIFIER_TYPES_FAILURE:
      return { ...state, error: action.error, isFetching: false };

    default:
      return state;
  }
};

export default identifierType;
