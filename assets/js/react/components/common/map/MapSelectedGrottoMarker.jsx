import React from 'react';
import PropTypes from 'prop-types';
import { Marker } from 'react-leaflet';
import MapGrottosPopup from './MapGrottosPopup';

//
//
// S T Y L I N G - C O M P O N E N T S
//
//

const mainMarkerIcon = L.icon({
  iconUrl: '/images/club.svg',
  iconSize: [
    30, 30,
  ],
  iconAnchor: [
    16, 32,
  ],
  popupAnchor: [0, -32],
});

const MapGrottoMarker = ({ grotto }) => (
  <Marker
    icon={mainMarkerIcon}
    key={`grotto_${grotto.id}`}
    position={{
      lat: grotto.latitude,
      lng: grotto.longitude,
    }}
    onAdd={(e) => {
      e.target.openPopup();
    }}
  >
    <MapGrottosPopup
      grotto={grotto}
    />
  </Marker>
);

MapGrottoMarker.propTypes = {
  grotto: PropTypes.object.isRequired,
};

export default MapGrottoMarker;
