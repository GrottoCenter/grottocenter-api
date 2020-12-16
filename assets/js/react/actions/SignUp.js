import fetch from 'isomorphic-fetch';
import { signUpUrl } from '../conf/Config';
import makeErrorMessage from '../helpers/makeErrorMessage';

// ==========
export const FETCH_SIGN_UP = 'FETCH_SIGN_UP';
export const FETCH_SIGN_UP_SUCCESS = 'FETCH_SIGN_UP_SUCCESS';
export const FETCH_SIGN_UP_FAILURE = 'FETCH_SIGN_UP_FAILURE';

// ==========

export const fetchSignUp = () => ({
  type: FETCH_SIGN_UP,
});

export const fetchSignUpSuccess = () => ({
  type: FETCH_SIGN_UP_SUCCESS,
});

export const fetchSignUpFailure = (error) => ({
  type: FETCH_SIGN_UP_FAILURE,
  error,
});

/**
 *
 * @param {*} data with the following structure:
 * - name {String} (optional)
 * - surname {String} (optional)
 * - nickname {String}
 * - email {String}
 * - password {String}
 */
export function postSignUp(data) {
  return (dispatch) => {
    dispatch(fetchSignUp());

    const requestOptions = {
      method: 'POST',
      body: JSON.stringify(data),
    };

    return fetch(signUpUrl, requestOptions)
      .then((response) => {
        if (response.ok) {
          // there is no content in the response in case of success
          dispatch(fetchSignUpSuccess());
        } else {
          throw response;
        }
      })
      .catch((response) => {
        const statusCode = response.status;
        response.text().then((responseText) => {
          const errorMessage =
            statusCode === 500
              ? 'A server error occurred, please try again later or contact Wikicaves for more information.'
              : responseText;
          dispatch(
            fetchSignUpFailure(
              makeErrorMessage(statusCode, `SignUp - ${errorMessage}`),
            ),
          );
        });
      });
  };
}
