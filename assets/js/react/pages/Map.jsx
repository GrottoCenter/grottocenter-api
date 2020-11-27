import React, { useEffect } from 'react';
import { includes } from 'ramda';
import { useHistory, generatePath } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import MapClusters from '../components/common/Maps/MapClusters';
import {
  changeLocation,
  changeZoom,
  fetchNetworks,
  fetchNetworksCoordinates,
  fetchOrganizations,
  fetchEntrances,
  fetchEntrancesCoordinates,
} from '../actions/Map';
import { fetchProjections } from '../actions/Projections';

const encodePathLocation = (pathLocation) =>
  Buffer.from(pathLocation).toString('base64');

const Map = () => {
  const history = useHistory();
  const dispatch = useDispatch();
  const {
    location,
    zoom,
    // TODO handle loading
    // eslint-disable-next-line no-unused-vars
    loadings,
    networks,
    networksCoordinates,
    organizations,
    entrances,
    entrancesCoordinates,
  } = useSelector((state) => state.map);
  const { open } = useSelector((state) => state.sideMenu);
  const { projections } = useSelector((state) => state.projections);
  const handleUpdate = ({ heat, markers, zoom: newZoom, center, bounds }) => {
    const encodedPathLocation = encodePathLocation(
      `lng=${center.lng}&lat=${center.lat}&zoom=${newZoom}`,
    );
    history.push(
      generatePath('/ui/map/:target', { target: encodedPathLocation }),
    );
    dispatch(changeLocation(center));
    dispatch(changeZoom(zoom));
    const criteria = {
      // eslint-disable-next-line no-underscore-dangle
      sw_lat: bounds._southWest.lat,
      // eslint-disable-next-line no-underscore-dangle
      sw_lng: bounds._southWest.lng,
      // eslint-disable-next-line no-underscore-dangle
      ne_lat: bounds._northEast.lat,
      // eslint-disable-next-line no-underscore-dangle
      ne_lng: bounds._northEast.lng,
      zoom: newZoom,
    };
    if (includes('organizations', markers)) {
      dispatch(fetchOrganizations(criteria));
    }
    if (includes('networks', markers)) {
      dispatch(fetchNetworks(criteria));
    }
    if (includes('entrances', markers)) {
      dispatch(fetchEntrances(criteria));
    }
    if (heat === 'networks') {
      dispatch(fetchNetworksCoordinates(criteria));
    }
    if (heat === 'entrances') {
      dispatch(fetchEntrancesCoordinates(criteria));
    }
  };

  useEffect(() => {
    dispatch(fetchProjections());
  }, []);

  return (
    <MapClusters
      center={[location.lat, location.lng]}
      zoom={zoom}
      entrances={entrancesCoordinates}
      entranceMarkers={entrances}
      networks={networksCoordinates}
      networkMarkers={networks}
      organizations={organizations}
      onUpdate={handleUpdate}
      isSideMenuOpen={open}
      projectionsList={projections}
    />
  );
};

Map.propTypes = {};

export default Map;
