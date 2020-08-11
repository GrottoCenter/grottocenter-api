import fetch from 'isomorphic-fetch';
import { bbsRegionsByNameUrl } from '../conf/Config';

export const FETCH_BBS_REGIONS_BY_NAME = 'FETCH_BBS_REGIONS_BY_NAME';
export const FETCH_BBS_REGIONS_BY_NAME_SUCCESS =
  'FETCH_BBS_REGIONS_BY_NAME_SUCCESS';
export const FETCH_BBS_REGIONS_BY_NAME_FAILURE =
  'FETCH_BBS_REGIONS_BY_NAME_FAILURE';
export const RESET_BBS_REGIONS_BY_NAME = 'RESET_BBS_REGIONS_BY_NAME';

export const fetchBBSRegionsByName = () => ({
  type: FETCH_BBS_REGIONS_BY_NAME,
});

export const fetchBBSRegionsByNameSuccess = (regions) => ({
  type: FETCH_BBS_REGIONS_BY_NAME_SUCCESS,
  regions,
});

export const fetchBBSRegionsByNameFailure = (error) => ({
  type: FETCH_BBS_REGIONS_BY_NAME_FAILURE,
  error,
});

export const resetBBSRegionsByName = () => ({
  type: RESET_BBS_REGIONS_BY_NAME,
});

export function loadBBSRegionsByName(regionName) {
  return (dispatch) => {
    dispatch(fetchBBSRegionsByName());

    return fetch(bbsRegionsByNameUrl + regionName)
      .then((response) => {
        if (response.status >= 400) {
          const errorMessage = `Fetching ${bbsRegionsByNameUrl} status: ${response.status}`;
          dispatch(fetchBBSRegionsByNameFailure(errorMessage));
          throw new Error(errorMessage);
        }
        return response.text();
      })
      .then((text) =>
        dispatch(fetchBBSRegionsByNameSuccess(JSON.parse(text).regions)),
      );
  };
}
