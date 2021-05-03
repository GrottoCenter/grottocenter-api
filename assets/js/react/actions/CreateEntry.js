import fetch from 'isomorphic-fetch';
import { postEntryUrl } from '../conf/Config';

export const POST_ENTRY = 'POST_ENTRY';
export const POST_ENTRY_SUCCESS = 'POST_ENTRY_SUCCESS';
export const POST_ENTRY_FAILURE = 'POST_ENTRY_FAILURE';

export const postEntryAction = () => ({
  type: POST_ENTRY,
});

export const postEntrySuccess = (entry) => ({
  type: POST_ENTRY_SUCCESS,
  entry,
});

export const postEntryFailure = (error) => ({
  type: POST_ENTRY_FAILURE,
  error,
});

export const postEntry = ({
  cave,
  description,
  name,
  location,
  country,
  precision,
  altitude,
}) => (dispatch, getState) => {
  dispatch(postEntryAction());
  const requestOptions = {
    method: 'POST',
    body: JSON.stringify({
      cave: { id: cave.id },
      description,
      name,
      precision,
      latitude: cave.latitude,
      longitude: cave.longitude,
      altitude,
      isPublic: true,
      modalities: 'NO,NO,NO,NO',
      location,
      country,
    }),
    headers: getState().login.authorizationHeader,
  };

  return fetch(postEntryUrl, requestOptions)
    .then((response) => {
      if (response.status >= 400) {
        throw new Error(response.status);
      }
      return response.text();
    })
    .then((text) => dispatch(postEntrySuccess(JSON.parse(text))))
    .catch((errorMessage) => {
      dispatch(postEntryFailure(errorMessage));
    });
};
