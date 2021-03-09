import fetch from 'isomorphic-fetch';
import { getLanguagesUrl } from '../conf/Config';
import makeErrorMessage from '../helpers/makeErrorMessage';
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

export function loadLanguages(isPreferredLanguage) {
  return (dispatch) => {
    dispatch(fetchLanguages());

    return fetch(`${getLanguagesUrl}?isPreferedLanguage=${isPreferredLanguage}`)
      .then((response) => {
        if (response.status >= 400) {
          throw new Error(response.status);
        }
        return response.text();
      })
      .then((text) =>
        dispatch(fetchLanguagesSuccess(JSON.parse(text).languages)),
      )
      .catch((error) =>
        dispatch(
          fetchLanguagesFailure(
            makeErrorMessage(error.message, `Fetching languages`),
          ),
        ),
      );
  };
}

export const changeLanguage = (lang) => ({
  type: CHANGE_LANGUAGE,
  lang,
});
