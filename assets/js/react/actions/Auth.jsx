import fetch from 'isomorphic-fetch';
import { loginUrl, identificationTokenName } from '../conf/Config';

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
    dispatch(logout);
    window.localStorage.removeItem(identificationTokenName);
  };
}

export function postLogin(contactEmail, password) {
  return (dispatch) => {
    dispatch(fetchLogin());

    const requestOptions = {
      method: 'POST',
      body: JSON.stringify({ contact: contactEmail, password }),
    };

    return fetch(loginUrl, requestOptions)
      .then((response) => {
        if (response.status >= 400) {
          const errorMessages = [];
          if (response.status === 401) {
            errorMessages.push('Invalid email or password.');
          }
          dispatch(fetchLoginFailure(errorMessages));
          throw new Error(
            `Fetching ${loginUrl} status: ${response.status}`,
            errorMessages,
          );
        }
        return response.json();
      })
      .then((json) => {
        window.localStorage.setItem(identificationTokenName, json.token);
        dispatch(fetchLoginSuccess(json.user, json.token));
        dispatch(hideLoginDialog());
      });
  };
}
