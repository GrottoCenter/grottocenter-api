import fetch from 'isomorphic-fetch';
import { findBbsUrl } from '../conf/Config';
import makeErrorMessage from '../helpers/makeErrorMessage';

export const FETCH_BBS = 'FETCH_BBS';
export const FETCH_BBS_SUCCESS = 'FETCH_BBS_SUCCESS';
export const FETCH_BBS_FAILURE = 'FETCH_BBS_FAILURE';

export const fetchBbs = () => ({
  type: FETCH_BBS,
});

export const fetchBbsSuccess = (bbs) => ({
  type: FETCH_BBS_SUCCESS,
  bbs,
});

export const fetchBbsFailure = (error) => ({
  type: FETCH_BBS_FAILURE,
  error,
});

export function loadBbs(bbsId) {
  return (dispatch) => {
    dispatch(fetchBbs());

    return fetch(findBbsUrl + encodeURIComponent(bbsId))
      .then((response) => {
        if (response.status >= 400) {
          throw new Error(response.status);
        }
        return response.text();
      })
      .then((text) => dispatch(fetchBbsSuccess(JSON.parse(text))))
      .catch((error) =>
        dispatch(
          fetchBbsFailure(
            makeErrorMessage(error.message, `Fetching bbs id ${bbsId}`),
          ),
        ),
      );
  };
}
