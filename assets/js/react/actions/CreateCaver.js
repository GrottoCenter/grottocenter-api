import fetch from 'isomorphic-fetch';
import { postCaverUrl } from '../conf/Config';

export const POST_CAVER = 'POST_CAVER';
export const POST_CAVER_SUCCESS = 'POST_CAVER_SUCCESS';
export const POST_CAVER_FAILURE = 'POST_CAVER_FAILURE';

export const postCaverAction = () => ({
  type: POST_CAVER,
});

export const postCaverSuccess = (caver) => ({
  type: POST_CAVER_SUCCESS,
  caver,
});

export const postCaverFailure = (error) => ({
  type: POST_CAVER_FAILURE,
  error,
});

export const postCaver = ({ name, surname }) => (dispatch, getState) => {
  dispatch(postCaverAction());

  const requestOptions = {
    method: 'POST',
    body: JSON.stringify({ name, surname }),
    headers: getState().auth.authorizationHeader,
  };

  return fetch(postCaverUrl, requestOptions)
    .then((response) => {
      if (response.status >= 400) {
        throw new Error(response.status);
      }
      return response.text();
    })
    .then((text) => dispatch(postCaverSuccess(JSON.parse(text))))
    .catch((errorMessage) => {
      dispatch(postCaverFailure(errorMessage));
    });
};
