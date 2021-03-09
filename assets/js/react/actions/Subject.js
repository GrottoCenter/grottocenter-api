import fetch from 'isomorphic-fetch';
import { subjectsUrl, subjectsSearchUrl } from '../conf/Config';
import makeErrorMessage from '../helpers/makeErrorMessage';

export const FETCH_SUBJECTS = 'FETCH_SUBJECTS';
export const FETCH_SUBJECTS_SUCCESS = 'FETCH_SUBJECTS_SUCCESS';
export const FETCH_SUBJECTS_FAILURE = 'FETCH_SUBJECTS_FAILURE';

export const SUBJECTS_SEARCH = 'SUBJECTS_SEARCH';
export const SUBJECTS_SEARCH_SUCCESS = 'SUBJECTS_SEARCH_SUCCESS';
export const SUBJECTS_SEARCH_FAILURE = 'SUBJECTS_SEARCH_FAILURE';
export const RESET_SUBJECTS_SEARCH = 'RESET_SUBJECTS_SEARCH';

export const fetchSubjects = () => ({
  type: FETCH_SUBJECTS,
});

export const fetchSubjectsSuccess = (subjects) => ({
  type: FETCH_SUBJECTS_SUCCESS,
  subjects,
});

export const fetchSubjectsFailure = (error) => ({
  type: FETCH_SUBJECTS_FAILURE,
  error,
});

export const subjectsSearch = () => ({
  type: SUBJECTS_SEARCH,
});

export const subjectsSearchSuccess = (subjects) => ({
  type: SUBJECTS_SEARCH_SUCCESS,
  subjects,
});

export const subjectsSearchFailure = (error) => ({
  type: SUBJECTS_SEARCH_FAILURE,
  error,
});

export const resetSubjectsSearch = () => ({
  type: RESET_SUBJECTS_SEARCH,
});

export function loadSubjects() {
  return (dispatch) => {
    dispatch(fetchSubjects());

    return fetch(subjectsUrl)
      .then((response) => {
        if (response.status >= 400) {
          throw new Error(response.status);
        }
        return response.text();
      })
      .then((text) => dispatch(fetchSubjectsSuccess(JSON.parse(text).subjects)))
      .catch((error) =>
        dispatch(
          fetchSubjectsFailure(
            makeErrorMessage(error.message, `Fetching subjects`),
          ),
        ),
      );
  };
}

export function loadSubjectsSearch(subjectCode, subjectName) {
  return (dispatch) => {
    dispatch(subjectsSearch());
    return fetch(subjectsSearchUrl, {
      method: 'POST',
      body: JSON.stringify({
        code: subjectCode,
        name: subjectName,
      }),
    })
      .then((response) => {
        if (response.status >= 400) {
          throw new Error(response.status);
        }
        return response.text();
      })
      .then((text) =>
        dispatch(subjectsSearchSuccess(JSON.parse(text).subjects)),
      )
      .catch((error) =>
        dispatch(
          subjectsSearchFailure(
            makeErrorMessage(
              error.message,
              `Fetching subjects search ${subjectName}`,
            ),
          ),
        ),
      );
  };
}
