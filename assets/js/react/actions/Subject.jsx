import fetch from 'isomorphic-fetch';
import { subjectsUrl } from '../conf/Config';

export const FETCH_SUBJECTS = 'FETCH_SUBJECTS';
export const FETCH_SUBJECTS_SUCCESS = 'FETCH_SUBJECTS_SUCCESS';
export const FETCH_SUBJECTS_FAILURE = 'FETCH_SUBJECTS_FAILURE';

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
