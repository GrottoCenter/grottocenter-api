import fetch from 'isomorphic-fetch';
import { decode } from 'jsonwebtoken';
import { loginUrl } from '../conf/Config';

// ==========
export const FETCH_LOGIN = 'FETCH_LOGIN';
export const FETCH_LOGIN_SUCCESS = 'FETCH_LOGIN_SUCCESS';
export const FETCH_LOGIN_FAILURE = 'FETCH_LOGIN_FAILURE';

export const DISPLAY_LOGIN_DIALOG = 'DISPLAY_LOGIN_DIALOG';
export const HIDE_LOGIN_DIALOG = 'HIDE_LOGIN_DIALOG';

export const SET_AUTH_ERROR_MESSAGES = 'SET_AUTH_ERROR_MESSAGES';

export const LOGOUT = 'LOGOUT';

// ==========

export const fetchLogin = () => ({
  type: FETCH_LOGIN,
});

export const fetchLoginSuccess = (account, token) => ({
  type: FETCH_LOGIN_SUCCESS,
  account,
  token,
});

export const fetchLoginFailure = (errorMessages) => ({
  type: FETCH_LOGIN_FAILURE,
  errorMessages,
});

export const displayLoginDialog = () => ({
  type: DISPLAY_LOGIN_DIALOG,
});

export const hideLoginDialog = () => ({
  type: HIDE_LOGIN_DIALOG,
});

export const logout = () => ({
  type: LOGOUT,
});

export const setAuthErrorMessagesAction = (errorMessages) => ({
  type: SET_AUTH_ERROR_MESSAGES,
  errorMessages,
});

export function setAuthErrorMessages(errorMessages) {
  return (dispatch) => {
    dispatch(setAuthErrorMessagesAction(errorMessages));
  };
}

export function postLogout() {
  return (dispatch) => {
    dispatch(logout());
  };
}

export function postLogin(email, password) {
  return (dispatch) => {
    dispatch(fetchLogin());

    const requestOptions = {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    };

    return fetch(loginUrl, requestOptions)
      .then((response) => {
        if (response.status >= 400) {
          let errorMessage = '';
          if (response.status === 401) {
            errorMessage = 'Invalid email or password.';
          } else if (response.status === 500) {
            errorMessage =
              'A server error occurred, please try again later or contact Wikicaves for more information.';
          } else {
            errorMessage = 'An unknown error occurred.';
          }
          throw new Error(errorMessage);
        } else {
          return response.json();
        }
      })
      .then((json) => {
        dispatch(fetchLoginSuccess(decode(json.token), json.token));
        dispatch(hideLoginDialog());
      })
      .catch((authError) => {
        dispatch(fetchLoginFailure([authError.message]));
      });
  };
}
