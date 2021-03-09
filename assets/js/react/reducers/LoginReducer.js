import { decode } from 'jsonwebtoken';
import {
  FETCH_LOGIN,
  FETCH_LOGIN_FAILURE,
  FETCH_LOGIN_SUCCESS,
  DISPLAY_LOGIN_DIALOG,
  HIDE_LOGIN_DIALOG,
  LOGOUT,
} from '../actions/Login';
import { authTokenName } from '../conf/Config';

//
//
// D E F A U L T - S T A T E
//
//

const removeTokenFromLocalStorage = () => {
  window.localStorage.removeItem(authTokenName);
};

const getTokenIfNotExpired = () => {
  const token = decode(window.localStorage.getItem(authTokenName));
  if (token === null) {
    return null;
  }
  // JS uses miliseconds for Unix time while JWT uses seconds
  if (new Date(token.exp * 1000) > Date.now()) {
    return token;
  }
  removeTokenFromLocalStorage();
  return null;
};

const initialState = {
  authTokenDecoded: getTokenIfNotExpired(),
  authorizationHeader: {
    Authorization: `Bearer ${getTokenIfNotExpired()}`,
  },
  error: null,
  isFetching: false,
  isLoginDialogDisplayed: false,
};

//
//
// R E D U C E R
//
//
const login = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_LOGIN:
      return {
        ...state,
        authToken: undefined,
        authorizationHeader: undefined,
        isFetching: true,
        error: null,
      };
    case FETCH_LOGIN_SUCCESS:
      window.localStorage.setItem(authTokenName, action.token);
      return {
        ...state,
        authToken: action.token,
        authorizationHeader: { Authorization: `Bearer ${action.token}` },
        error: null,
        isFetching: false,
        authTokenDecoded: action.tokenDecoded,
      };
    case FETCH_LOGIN_FAILURE:
      return {
        ...state,
        isFetching: false,
        error: action.error,
      };
    case DISPLAY_LOGIN_DIALOG:
      return { ...state, isLoginDialogDisplayed: true };
    case HIDE_LOGIN_DIALOG:
      return { ...state, isLoginDialogDisplayed: false };
    case LOGOUT:
      removeTokenFromLocalStorage();
      return {
        ...state,
        authToken: undefined,
        authorizationHeader: undefined,
        authTokenDecoded: null,
      };
    default:
      return state;
  }
};

export default login;
