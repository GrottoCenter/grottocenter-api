import fetch from 'isomorphic-fetch';
import { postCaveUrl } from '../conf/Config';

export const POST_CAVE = 'POST_CAVE';
export const POST_CAVE_SUCCESS = 'POST_CAVE_SUCCESS';
export const POST_CAVE_FAILURE = 'POST_CAVE_FAILURE';

export const postCaveAction = () => ({
  type: POST_CAVE,
});

export const postCaveSuccess = (cave) => ({
  type: POST_CAVE_SUCCESS,
  cave,
});

export const postCaveFailure = (error) => ({
  type: POST_CAVE_FAILURE,
  error,
});

export const postCave = ({
  name,
  language,
  latitude,
  longitude,
  length,
  depth,
}) => (dispatch, getState) => {
  dispatch(postCaveAction());

  const requestOptions = {
    method: 'POST',
    body: JSON.stringify({
      name,
      descriptionAndNameLanguage: {
        id: language,
      },
      latitude,
      longitude,
      length,
      depth,
    }),
    headers: getState().login.authorizationHeader,
  };

  return fetch(postCaveUrl, requestOptions)
    .then((response) => {
      if (response.status >= 400) {
        throw new Error(response.status);
      }
      return response.text();
    })
    .then((text) => dispatch(postCaveSuccess(JSON.parse(text))))
    .catch((errorMessage) => {
      dispatch(postCaveFailure(errorMessage));
    });
};
