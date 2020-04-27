import fetch from 'isomorphic-fetch';
import { loginUrl } from '../conf/Config';

export const FETCH_LOGIN = 'FETCH_LOGIN';
export const FETCH_LOGIN_SUCCESS = 'FETCH_LOGIN_SUCCESS';
export const FETCH_LOGIN_FAILURE = 'FETCH_LOGIN_FAILURE';

export const fetchLogin = () => ({
  type: FETCH_LOGIN,
});

export const fetchLoginSuccess = () => ({
  type: FETCH_LOGIN_SUCCESS,
});

export const fetchLoginFailure = (error) => ({
  type: FETCH_LOGIN_FAILURE,
  error,
});

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
          const errorMessage = `Fetching ${loginUrl} status: ${response.status}`;
          dispatch(fetchLoginFailure(errorMessage));
          throw new Error(errorMessage);
        }
        return response.text();
      })
      .then((text) => dispatch(fetchLoginSuccess(JSON.parse(text))));
  };
}
