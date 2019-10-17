import fetch from 'isomorphic-fetch';
import { findBbsUrl } from '../conf/Config';

export const FETCH_BBS = 'FETCH_BBS';
export const FETCH_BBS_SUCCESS = 'FETCH_BBS_SUCCESS';
export const FETCH_BBS_FAILURE = 'FETCH_BBS_FAILURE';

export const fetchBbs = () => ({
  type: FETCH_BBS,
});

export const fetchBbsSuccess = bbs => ({
  type: FETCH_BBS_SUCCESS,
  bbs,
});

export const fetchBbsFailure = error => ({
  type: FETCH_BBS_FAILURE,
  error,
});

export function loadBbs(bbsId) {
  return (dispatch) => {
    dispatch(fetchBbs());

    return fetch(findBbsUrl + encodeURIComponent(bbsId) + "/") // WORKAROUND: there is a dot in the bbsId so a trailing slash is needed here
      .then((response) => {
        if (response.status >= 400) {
          const errorMessage = `Fetching ${findBbsUrl} status: ${response.status}`;
          dispatch(fetchBbsFailure(errorMessage));
          throw new Error(errorMessage);
        }
        return response.text();
      })
      .then(text => dispatch(fetchBbsSuccess(JSON.parse(text))));
  };
}
