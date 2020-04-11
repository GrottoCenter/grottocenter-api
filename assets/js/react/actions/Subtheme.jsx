import fetch from 'isomorphic-fetch';
import { subthemesUrl } from '../conf/Config';

export const FETCH_SUBTHEMES = 'FETCH_SUBTHEMES';
export const FETCH_SUBTHEMES_SUCCESS = 'FETCH_SUBTHEMES_SUCCESS';
export const FETCH_SUBTHEMES_FAILURE = 'FETCH_SUBTHEMES_FAILURE';

export const fetchSubthemes = () => ({
  type: FETCH_SUBTHEMES,
});

export const fetchSubthemesSuccess = (subthemes) => ({
  type: FETCH_SUBTHEMES_SUCCESS,
  subthemes,
});

export const fetchSubthemesFailure = (error) => ({
  type: FETCH_SUBTHEMES_FAILURE,
  error,
});

export function loadSubthemes() {
  return (dispatch) => {
    dispatch(fetchSubthemes());

    return fetch(subthemesUrl)
      .then((response) => {
        if (response.status >= 400) {
          const errorMessage = `Fetching ${subthemesUrl} status: ${response.status}`;
          dispatch(fetchSubthemesFailure(errorMessage));
          throw new Error(errorMessage);
        }
        return response.text();
      })
      .then((text) => dispatch(fetchSubthemesSuccess(JSON.parse(text))));
  };
}
