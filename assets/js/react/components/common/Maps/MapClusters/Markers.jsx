import React, { useEffect } from 'react';
import { includes, propOr, values } from 'ramda';
import PropTypes from 'prop-types';

import { heatmapTypes } from './DataControl';
import useMarkers, { MarkerGlobalCss } from '../common/Markers/useMarkers';
import {
  OrganizationMarker,
  OrganizationPopup,
  EntranceMarker,
  EntrancePopup,
  NetworkMarker,
  NetworkPopup,
} from '../common/Markers/Components';

export const markerTypes = {
  ORGANIZATIONS: 'organizations',
  ...heatmapTypes,
};

const isEntrances = includes(markerTypes.ENTRANCES);
const isNetworks = includes(markerTypes.NETWORKS);
const isOrganizations = includes(markerTypes.ORGANIZATIONS);

const Markers = ({
  visibleMarkers,
  organizations = [],
  entrances = [],
  networks = [],
}) => {
  const updateEntranceMarkers = useMarkers(
    EntranceMarker,
    (entrance) => <EntrancePopup entrance={entrance} />,
    (entrance) => propOr(null, 'name', entrance),
  );
  const updateNetworkMarkers = useMarkers(
    NetworkMarker,
    (network) => <NetworkPopup network={network} />,
    (network) => propOr(null, 'name', network),
  );
  const updateOrganizationMarkers = useMarkers(
    OrganizationMarker,
    (organization) => <OrganizationPopup organization={organization} />,
    (organization) => propOr(null, 'name', organization),
  );

  useEffect(() => {
    if (isEntrances(visibleMarkers)) {
      updateEntranceMarkers(entrances);
    } else {
      updateEntranceMarkers(null);
    }
  }, [entrances, visibleMarkers]);

  useEffect(() => {
    if (isNetworks(visibleMarkers)) {
      updateNetworkMarkers(networks);
    } else {
      updateNetworkMarkers(null);
    }
  }, [networks, visibleMarkers]);

  useEffect(() => {
    if (isOrganizations(visibleMarkers)) {
      updateOrganizationMarkers(organizations);
    } else {
      updateOrganizationMarkers(null);
    }
  }, [organizations, visibleMarkers]);

  return <MarkerGlobalCss />;
};

const MemoizedMarkers = React.memo(Markers);

Markers.propTypes = {
  visibleMarkers: PropTypes.arrayOf(PropTypes.oneOf(values(markerTypes))),
  organizations: PropTypes.arrayOf(PropTypes.shape({})),
  entrances: PropTypes.arrayOf(PropTypes.shape({})),
  networks: PropTypes.arrayOf(PropTypes.shape({})),
};
MemoizedMarkers.propTypes = Markers.propTypes;

export default MemoizedMarkers;
