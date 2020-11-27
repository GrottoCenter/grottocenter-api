import { Icon } from '@material-ui/core';
import * as L from 'leaflet';
import { renderToString } from 'react-dom/server';
import React from 'react';
import markers from '../../../../../../conf/MapMarkersConfig';

const OrganizationIcon = () => (
  <Icon
    color="inherit"
    style={{ textAlign: 'center', height: '100%', width: '100%' }}
  >
    <img
      alt="organizationIcon"
      style={{ height: '100%' }}
      src={markers.find((m) => m.name === 'Organizations').url}
    />
  </Icon>
);

export const OrganizationMarker = L.divIcon({
  html: renderToString(<OrganizationIcon />),
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  className: '',
});

export default OrganizationMarker;
