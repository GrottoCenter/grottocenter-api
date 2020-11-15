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

import {
  getAuthToken,
  removeAuthToken,
  setAuthToken,
} from '../helpers/AuthHelper';

//
//
// D E F A U L T - S T A T E
//
//

const initialState = {
  userAccount: decode(getAuthToken()),
  isFetching: false,
  isLoginDialogDisplayed: false,
  errorMessages: [],
};

//
//
// R E D U C E R
//
//
const auth = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_LOGIN:
      return { ...state, isFetching: true, errorMessages: [] };
    case FETCH_LOGIN_SUCCESS:
      setAuthToken(action.token);
      return {
        ...state,
        userAccount: action.account,
        isFetching: false,
        errorMessages: [],
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
      removeAuthToken();
      return { ...state, userAccount: undefined };
    case SET_AUTH_ERROR_MESSAGES:
      return { ...state, errorMessages: action.errorMessages };
    default:
      return state;
  }
};

export default auth;
