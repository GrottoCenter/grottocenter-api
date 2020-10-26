import React from 'react';
import PropTypes from 'prop-types';
import { Marker } from 'react-leaflet';
import MapGrottosPopup from './MapGrottosPopup';
import markers from '../../../../conf/MapMarkersConfig';

//
//
// S T Y L I N G - C O M P O N E N T S
//
//

const mainMarkerIcon = L.icon({
  iconUrl: markers.find((m) => m.name === 'Organizations').url,
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  popupAnchor: [0, -24],
});

const MapGrottoMarker = ({ grotto }) => (
  <Marker
    icon={mainMarkerIcon}
    key={`grotto_${grotto.id}`}
    position={{
      lat: grotto.latitude,
      lng: grotto.longitude,
    }}
  >
    <MapGrottosPopup grotto={grotto} />
  </Marker>
);

MapGrottoMarker.propTypes = {
  grotto: PropTypes.shape({
    id: PropTypes.number,
    latitude: PropTypes.number,
    longitude: PropTypes.number,
  }).isRequired,
};

export default MapGrottoMarker;
