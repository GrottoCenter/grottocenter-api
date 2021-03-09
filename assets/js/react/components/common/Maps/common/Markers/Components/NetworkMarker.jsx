import { Icon } from '@material-ui/core';
import * as L from 'leaflet';
import { renderToString } from 'react-dom/server';
import React from 'react';
import markers from '../../../../../../conf/MapMarkersConfig';

const NetworkIcon = () => (
  <Icon
    color="inherit"
    style={{ textAlign: 'center', height: '100%', width: '100%' }}
  >
    <img
      alt="networkIcon"
      style={{ height: '100%' }}
      src={markers.find((m) => m.name === 'Caves').url}
    />
  </Icon>
);

export const NetworkMarker = L.divIcon({
  html: renderToString(<NetworkIcon />),
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  className: 'fade-in-markers',
});

export default NetworkMarker;
