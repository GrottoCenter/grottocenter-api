import fetch from 'isomorphic-fetch';
import {
  getMapCavesUrl,
  getMapCavesCoordinatesUrl,
  getMapEntrancesUrl,
  getMapEntrancesCoordinatesUrl,
  getMapGrottosUrl,
} from '../conf/Config';
import makeErrorMessage from '../helpers/makeErrorMessage';

export const FETCH_MAP_START_LOADING = 'FETCH_MAP_LOADING';
export const FETCH_MAP_END_LOADING = 'FETCH_MAP_LOADING';
export const FETCH_MAP_NETWORKS_SUCCESS = 'FETCH_MAP_NETWORKS_SUCCESS';
export const FETCH_MAP_NETWORKS_FAILURE = 'FETCH_MAP_NETWORKS_FAILURE';
export const FETCH_MAP_NETWORKS_COORDINATES_SUCCESS =
  'FETCH_MAP_NETWORKS_COORDINATES_SUCCESS';
export const FETCH_MAP_NETWORKS_COORDINATES_FAILURE =
  'FETCH_MAP_NETWORKS_COORDINATES_FAILURE';
export const FETCH_MAP_ENTRANCES_SUCCESS = 'FETCH_MAP_ENTRANCES_SUCCESS';
export const FETCH_MAP_ENTRANCES_FAILURE = 'FETCH_MAP_ENTRANCES_FAILURE';
export const FETCH_MAP_ENTRANCES_COORDINATES_SUCCESS =
  'FETCH_MAP_ENTRANCES_COORDINATES_SUCCESS';
export const FETCH_MAP_ENTRANCES_COORDINATES_FAILURE =
  'FETCH_MAP_ENTRANCES_COORDINATES_FAILURE';
export const FETCH_MAP_ORGANIZATIONS_SUCCESS =
  'FETCH_MAP_ORGANIZATIONS_SUCCESS';
export const FETCH_MAP_ORGANIZATIONS_FAILURE =
  'FETCH_MAP_ORGANIZATIONS_FAILURE';
export const CHANGE_LOCATION = 'CHANGE_LOCATION';
export const CHANGE_ZOOM = 'CHANGE_ZOOM';
export const FOCUS_ON_LOCATION = 'FOCUS_ON_LOCATION';

export const LOADINGS = {
  NETWORKS: 'networks',
  NETWORKS_COORDINATES: 'networks_coordinates',
  ENTRANCES: 'entrances',
  ENTRANCES_COORDINATES: 'entrances_coordinates',
  ORGANIZATIONS: 'organizations',
};

const makeUrl = (url, criteria) => {
  if (criteria) {
    return `${url}?${Object.keys(criteria)
      .map((k) => `${k}=${encodeURIComponent(criteria[k])}`)
      .join('&')}`;
  }
  return url;
};

export const fetchNetworksCoordinates = (criteria) => {
  const thunkToDebounce = function(dispatch) {
    dispatch({
      type: FETCH_MAP_START_LOADING,
      key: LOADINGS.NETWORKS_COORDINATES,
    });
    const completedUrl = makeUrl(getMapCavesCoordinatesUrl, criteria);
    return fetch(completedUrl)
      .then((response) => {
        if (response.status >= 400) {
          throw new Error(response.status);
        }
        return response.text();
      })
      .then((text) => {
        dispatch({
          type: FETCH_MAP_NETWORKS_COORDINATES_SUCCESS,
          data: JSON.parse(text),
        });
      })
      .catch((error) => {
        dispatch({
          type: FETCH_MAP_NETWORKS_COORDINATES_FAILURE,
          error: makeErrorMessage(
            error.message,
            `Fetching networks coordinates`,
          ),
        });
      })
      .finally(() => {
        dispatch({
          type: FETCH_MAP_END_LOADING,
          key: LOADINGS.NETWORKS_COORDINATES,
        });
      });
  };

  thunkToDebounce.meta = {
    debounce: {
      time: 500,
      key: 'FETCH_MAP_NETWORKS_COORDINATES',
    },
  };

  return thunkToDebounce;
};

export const fetchNetworks = (criteria) => {
  const thunkToDebounce = function(dispatch) {
    dispatch({ type: FETCH_MAP_START_LOADING, key: LOADINGS.NETWORKS });
    const completedUrl = makeUrl(getMapCavesUrl, criteria);
    return fetch(completedUrl)
      .then((response) => {
        if (response.status >= 400) {
          throw new Error(response.status);
        }
        return response.text();
      })
      .then((text) => {
        dispatch({ type: FETCH_MAP_NETWORKS_SUCCESS, data: JSON.parse(text) });
      })
      .catch((error) => {
        dispatch({
          type: FETCH_MAP_NETWORKS_FAILURE,
          error: makeErrorMessage(error.message, `Fetching networks`),
        });
      })
      .finally(() => {
        dispatch({
          type: FETCH_MAP_END_LOADING,
          key: LOADINGS.NETWORKS,
        });
      });
  };

  thunkToDebounce.meta = {
    debounce: {
      time: 500,
      key: 'FETCH_MAP_NETWORKS',
    },
  };

  return thunkToDebounce;
};

export const fetchEntrancesCoordinates = (criteria) => {
  const thunkToDebounce = function(dispatch) {
    dispatch({
      type: FETCH_MAP_START_LOADING,
      key: LOADINGS.ENTRANCES_COORDINATES,
    });
    const completedUrl = makeUrl(getMapEntrancesCoordinatesUrl, criteria);
    return fetch(completedUrl)
      .then((response) => {
        if (response.status >= 400) {
          throw new Error(response.status);
        }
        return response.text();
      })
      .then((text) => {
        dispatch({
          type: FETCH_MAP_ENTRANCES_COORDINATES_SUCCESS,
          data: JSON.parse(text),
        });
      })
      .catch((error) => {
        dispatch({
          type: FETCH_MAP_ENTRANCES_COORDINATES_FAILURE,
          error: makeErrorMessage(
            error.message,
            `Fetching entrances coordinates`,
          ),
        });
      })
      .finally(() => {
        dispatch({
          type: FETCH_MAP_END_LOADING,
          key: LOADINGS.ENTRANCES_COORDINATES,
        });
      });
  };

  thunkToDebounce.meta = {
    debounce: {
      time: 500,
      key: 'FETCH_MAP_ENTRANCES',
    },
  };

  return thunkToDebounce;
};

export const fetchEntrances = (criteria) => {
  const thunkToDebounce = function(dispatch) {
    dispatch({ type: FETCH_MAP_START_LOADING, key: LOADINGS.ENTRANCES });
    const completedUrl = makeUrl(getMapEntrancesUrl, criteria);
    return fetch(completedUrl)
      .then((response) => {
        if (response.status >= 400) {
          throw new Error(response.status);
        }
        return response.text();
      })
      .then((text) => {
        dispatch({ type: FETCH_MAP_ENTRANCES_SUCCESS, data: JSON.parse(text) });
      })
      .catch((error) => {
        dispatch({
          type: FETCH_MAP_ENTRANCES_FAILURE,
          error: makeErrorMessage(error.message, `Fetching entrances`),
        });
      })
      .finally(() => {
        dispatch({
          type: FETCH_MAP_END_LOADING,
          key: LOADINGS.ENTRANCES,
        });
      });
  };

  thunkToDebounce.meta = {
    debounce: {
      time: 500,
      key: 'FETCH_MAP_ENTRANCES',
    },
  };

  return thunkToDebounce;
};

export const fetchOrganizations = (criteria) => {
  const thunkToDebounce = function(dispatch) {
    dispatch({ type: FETCH_MAP_START_LOADING, key: LOADINGS.ORGANIZATIONS });
    const completedUrl = makeUrl(getMapGrottosUrl, criteria);
    return fetch(completedUrl)
      .then((response) => {
        if (response.status >= 400) {
          throw new Error(response.status);
        }
        return response.text();
      })
      .then((text) => {
        dispatch({
          type: FETCH_MAP_ORGANIZATIONS_SUCCESS,
          data: JSON.parse(text),
        });
      })
      .catch((error) => {
        dispatch({
          type: FETCH_MAP_ORGANIZATIONS_FAILURE,
          error: makeErrorMessage(error.message, `Fetching organizations`),
        });
      })
      .finally(() => {
        dispatch({
          type: FETCH_MAP_END_LOADING,
          key: LOADINGS.ORGANIZATIONS,
        });
      });
  };

  thunkToDebounce.meta = {
    debounce: {
      time: 500,
      key: 'FETCH_MAP_ORGANIZATIONS',
    },
  };

  return thunkToDebounce;
};

export const changeZoom = (zoom) => ({
  type: CHANGE_ZOOM,
  zoom,
});

export const focusOnLocation = (location) => ({
  type: FOCUS_ON_LOCATION,
  location,
});

export const changeLocation = (location) => ({
  type: CHANGE_LOCATION,
  location,
});
