import fetch from 'isomorphic-fetch';
import { subjectsUrl, subjectsByNameUrl } from '../conf/Config';

export const FETCH_SUBJECTS = 'FETCH_SUBJECTS';
export const FETCH_SUBJECTS_SUCCESS = 'FETCH_SUBJECTS_SUCCESS';
export const FETCH_SUBJECTS_FAILURE = 'FETCH_SUBJECTS_FAILURE';

export const FETCH_SUBJECTS_BY_NAME = 'FETCH_SUBJECTS_BY_NAME';
export const FETCH_SUBJECTS_BY_NAME_SUCCESS = 'FETCH_SUBJECTS_BY_NAME_SUCCESS';
export const FETCH_SUBJECTS_BY_NAME_FAILURE = 'FETCH_SUBJECTS_BY_NAME_FAILURE';
export const RESET_SUBJECTS_BY_NAME = 'RESET_SUBJECTS_BY_NAME';

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

export const fetchSubjectsByName = () => ({
  type: FETCH_SUBJECTS_BY_NAME,
});

export const fetchSubjectsByNameSuccess = (subjects) => ({
  type: FETCH_SUBJECTS_BY_NAME_SUCCESS,
  subjects,
});

export const fetchSubjectsByNameFailure = (error) => ({
  type: FETCH_SUBJECTS_BY_NAME_FAILURE,
  error,
});

export const resetSubjectsByName = () => ({
  type: RESET_SUBJECTS_BY_NAME,
});

export function loadSubjects() {
  return (dispatch) => {
    dispatch(fetchSubjects());

    return fetch(subjectsUrl)
      .then((response) => {
        if (response.status >= 400) {
          const errorMessage = `Fetching ${subjectsUrl} status: ${response.status}`;
          dispatch(fetchSubjectsFailure(errorMessage));
          throw new Error(errorMessage);
        }
        return response.text();
      })
      .then((text) => dispatch(fetchSubjectsSuccess(JSON.parse(text))));
  };
}

export function loadSubjectsByName(subjectName) {
  return (dispatch) => {
    dispatch(fetchSubjectsByName());

    return fetch(subjectsByNameUrl + subjectName)
      .then((response) => {
        if (response.status >= 400) {
          const errorMessage = `Fetching ${subjectsByNameUrl} status: ${response.status}`;
          dispatch(fetchSubjectsByNameFailure(errorMessage));
          throw new Error(errorMessage);
        }
        return response.text();
      })
      .then((text) =>
        dispatch(fetchSubjectsByNameSuccess(JSON.parse(text).subjects)),
      );
  };
}
