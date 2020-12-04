import fetch from 'isomorphic-fetch';
import { decode } from 'jsonwebtoken';
import { loginUrl } from '../conf/Config';
import makeErrorMessage from '../helpers/makeErrorMessage';

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

export const fetchLoginSuccess = (tokenDecoded, token) => ({
  type: FETCH_LOGIN_SUCCESS,
  tokenDecoded,
  token,
});

export const fetchLoginFailure = (error) => ({
  type: FETCH_LOGIN_FAILURE,
  error,
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
          throw new Error(response.status);
        } else {
          return response.json();
        }
      })
      .then((json) => {
        dispatch(fetchLoginSuccess(decode(json.token), json.token));
        dispatch(hideLoginDialog());
      })
      .catch((error) => {
        const errorCode = Number(error.message);
        let errorMessage = 'An unknown error occurred.';
        if (errorCode === 401) {
          errorMessage = 'Invalid email or password.';
        } else if (errorCode === 500) {
          errorMessage =
            'A server error occurred, please try again later or contact Wikicaves for more information.';
        }
        dispatch(
          fetchLoginFailure(
            makeErrorMessage(errorCode, `Login - ${errorMessage}`),
          ),
        );
      });
  };
}
