import fetch from 'isomorphic-fetch';
import { getLanguagesUrl } from '../conf/Config';
//
//
// A C T I O N S
//
//

export const FETCH_LANGUAGES = 'FETCH_LANGUAGES';
export const FETCH_LANGUAGES_SUCCESS = 'FETCH_LANGUAGES_SUCCESS';
export const FETCH_LANGUAGES_FAILURE = 'FETCH_LANGUAGES_FAILURE';

export const CHANGE_LANGUAGE = 'CHANGE_LANGUAGE';

//
//
// A C T I O N S - C R E A T O R S
//
//

export const fetchLanguages = () => ({
  type: FETCH_LANGUAGES,
});

export const fetchLanguagesSuccess = (languages) => ({
  type: FETCH_LANGUAGES_SUCCESS,
  languages,
});

export const fetchLanguagesFailure = (error) => ({
  type: FETCH_LANGUAGES_FAILURE,
  error,
});

export function loadLanguages(isPreferedLanguage) {
  return (dispatch) => {
    dispatch(fetchLanguages());

    return fetch(`${getLanguagesUrl}?isPreferedLanguage=${isPreferedLanguage}`)
      .then((response) => {
        if (response.status >= 400) {
          const errorMessage = `Fetching ${getLanguagesUrl} status: ${response.status}`;
          dispatch(fetchLanguagesFailure(errorMessage));
          throw new Error(errorMessage);
        }
        return response.text();
      })
      .then((text) =>
        dispatch(fetchLanguagesSuccess(JSON.parse(text).languages)),
      );
  };
}

export const changeLanguage = (lang) => ({
  type: CHANGE_LANGUAGE,
  lang,
});
