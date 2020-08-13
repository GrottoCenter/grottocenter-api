import fetch from 'isomorphic-fetch';
import { regionsSearchUrl } from '../conf/Config';

export const REGIONS_SEARCH = 'REGIONS_SEARCH';
export const REGIONS_SEARCH_SUCCESS = 'REGIONS_SEARCH_SUCCESS';
export const REGIONS_SEARCH_FAILURE = 'REGIONS_SEARCH_FAILURE';
export const RESET_REGIONS_SEARCH = 'RESET_REGIONS_SEARCH';

export const searchRegions = () => ({
  type: REGIONS_SEARCH,
});

export const searchRegionsSuccess = (regions) => ({
  type: REGIONS_SEARCH_SUCCESS,
  regions,
});

export const searchRegionsFailure = (error) => ({
  type: REGIONS_SEARCH_FAILURE,
  error,
});

export const resetRegionsSearch = () => ({
  type: RESET_REGIONS_SEARCH,
});

export function loadRegionsSearch(regionCode, regionName, isDeprecated) {
  return (dispatch) => {
    dispatch(searchRegions());

    return fetch(regionsSearchUrl, {
      method: 'POST',
      body: JSON.stringify({
        code: regionCode,
        name: regionName,
        isDeprecated,
      }),
    })
      .then((response) => {
        if (response.status >= 400) {
          const errorMessage = `Fetching ${regionsSearchUrl} status: ${response.status}`;
          dispatch(searchRegionsFailure(errorMessage));
          throw new Error(errorMessage);
        }
        return response.text();
      })
      .then((text) => dispatch(searchRegionsSuccess(JSON.parse(text).regions)));
  };
}
