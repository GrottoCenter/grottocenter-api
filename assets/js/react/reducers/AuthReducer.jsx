import { decode } from 'jsonwebtoken';
import {
  FETCH_LOGIN,
  FETCH_LOGIN_FAILURE,
  FETCH_LOGIN_SUCCESS,
  DISPLAY_LOGIN_DIALOG,
  HIDE_LOGIN_DIALOG,
  LOGOUT,
  SET_AUTH_ERROR_MESSAGES,
} from '../actions/Auth';
import { authTokenName } from '../conf/Config';

//
//
// D E F A U L T - S T A T E
//
//

const initialState = {
  authToken: undefined,
  authTokenDecoded: decode(window.localStorage.getItem(authTokenName)),
  authorizationHeader: {
    Authorization: `Bearer ${window.localStorage.getItem(authTokenName)}`,
  },
  errorMessages: [],
  isFetching: false,
  isLoginDialogDisplayed: false,
};

//
//
// R E D U C E R
//
//
const auth = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_LOGIN:
      return {
        ...state,
        authToken: undefined,
        authorizationHeader: undefined,
        isFetching: true,
        errorMessages: [],
      };
    case FETCH_LOGIN_SUCCESS:
      window.localStorage.setItem(authTokenName, action.token);
      return {
        ...state,
        authToken: action.token,
        authorizationHeader: { Authorization: `Bearer ${action.token}` },
        errorMessages: [],
        isFetching: false,
        authTokenDecoded: action.tokenDecoded,
      };
    case FETCH_LOGIN_FAILURE:
      return {
        ...state,
        isFetching: false,
        errorMessages: action.errorMessages,
      };
    case DISPLAY_LOGIN_DIALOG:
      return { ...state, isLoginDialogDisplayed: true };
    case HIDE_LOGIN_DIALOG:
      return { ...state, isLoginDialogDisplayed: false };
    case LOGOUT:
      window.localStorage.removeItem(authTokenName);
      return {
        ...state,
        authToken: undefined,
        authorizationHeader: undefined,
        authTokenDecoded: null,
      };
    case SET_AUTH_ERROR_MESSAGES:
      return { ...state, errorMessages: action.errorMessages };
    default:
      return state;
  }
};

export default auth;
