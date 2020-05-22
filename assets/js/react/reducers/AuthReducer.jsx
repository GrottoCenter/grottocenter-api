import {
  FETCH_LOGIN,
  FETCH_LOGIN_FAILURE,
  FETCH_LOGIN_SUCCESS,
  DISPLAY_LOGIN_DIALOG,
  HIDE_LOGIN_DIALOG,
  LOGOUT,
} from '../actions/Auth';

import { identificationTokenName } from '../conf/Config';

//
//
// D E F A U L T - S T A T E
//
//

const initialState = {
  userAccount: undefined,
  isAuthenticated: window.localStorage.getItem(identificationTokenName) != null,
  isFetching: false,
  isLoginDialogDisplayed: false,
  errorMessage: '',
};

//
//
// R E D U C E R
//
//
const auth = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_LOGIN:
      return { ...state, isFetching: true, errorMessage: '' };
    case FETCH_LOGIN_SUCCESS:
      return {
        ...state,
        userAccount: action.account,
        isAuthenticated: true,
        isFetching: false,
      };
    case FETCH_LOGIN_FAILURE:
      return { ...state, isFetching: false, errorMessage: action.errorMessage };
    case DISPLAY_LOGIN_DIALOG:
      return { ...state, isLoginDialogDisplayed: true };
    case HIDE_LOGIN_DIALOG:
      return { ...state, isLoginDialogDisplayed: false };
    case LOGOUT:
      return { ...state, isAuthenticated: false };
    default:
      return state;
  }
};

export default auth;
