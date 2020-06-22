import React from 'react';
import PropTypes from 'prop-types';
import { Marker, Tooltip } from 'react-leaflet';
import { markers } from '../../../../conf/MapMarkersConfig';
import MapCavesPopup from './MapCavesPopup';

const mainMarkerIcon = L.icon({
  iconUrl: markers[1].url,
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  popupAnchor: [0, -24],
});

const MapCaveMarker = ({ cave }) => (
  <Marker
    icon={mainMarkerIcon}
    key={`cave_${cave.id}`}
    position={{
      lat: cave.latitude,
      lng: cave.longitude,
    }}
    onClick={(e) => {
      e.target.closeTooltip();
    }}
  >
    <MapCavesPopup cave={cave} />
    <Tooltip direction="top">{cave.name}</Tooltip>
  </Marker>
);

MapCaveMarker.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  cave: PropTypes.object.isRequired,
};

export default MapCaveMarker;
