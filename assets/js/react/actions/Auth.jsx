import fetch from 'isomorphic-fetch';
import { loginUrl, identificationTokenName } from '../conf/Config';

// ==========
export const FETCH_LOGIN = 'FETCH_LOGIN';
export const FETCH_LOGIN_SUCCESS = 'FETCH_LOGIN_SUCCESS';
export const FETCH_LOGIN_FAILURE = 'FETCH_LOGIN_FAILURE';

export const DISPLAY_LOGIN_DIALOG = 'DISPLAY_LOGIN_DIALOG';
export const HIDE_LOGIN_DIALOG = 'HIDE_LOGIN_DIALOG';

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

export const fetchLoginFailure = (errorMessage) => ({
  type: FETCH_LOGIN_FAILURE,
  errorMessage,
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
          let errorMessage = `Fetching ${loginUrl} status: ${response.status}`;
          if (response.status === 401) {
            errorMessage = 'Invalid email or password.';
          }
          dispatch(fetchLoginFailure(errorMessage));
          throw new Error(errorMessage);
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
