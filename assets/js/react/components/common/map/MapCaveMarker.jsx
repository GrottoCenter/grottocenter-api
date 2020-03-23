import React from 'react';
import PropTypes from 'prop-types';
import { Marker, Tooltip } from 'react-leaflet';
import { markers } from '../../../conf/MapMarkersConfig';

//
//
// S T Y L I N G - C O M P O N E N T S
//
//

const mainMarkerIcon = L.icon({
  iconUrl: markers[1].url,
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  popupAnchor: [0, -24],
});

//
//
// M A I N - C O M P O N E N T S
//
//

const MapCaveMarker = ({ cave }) => (
  <Marker
    icon={mainMarkerIcon}
    key={`cave${cave.id}`}
    position={{
      lat: cave.latitude,
      lng: cave.longitude,
    }}
  >
    <Tooltip direction="top" offset={[0, -20]}>
      {cave.name}
    </Tooltip>
  </Marker>
);

MapCaveMarker.propTypes = {
  cave: PropTypes.object.isRequired,
};

export default MapCaveMarker;
