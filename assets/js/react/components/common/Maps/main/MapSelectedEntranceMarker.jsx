import React from 'react';
import PropTypes from 'prop-types';
import { CircleMarker } from 'react-leaflet';
import MapEntrancePopup from './MapEntrancePopup';

//
//
// M A I N - C O M P O N E N T
//
//

const MapSelectedEntranceMarker = ({ selectedEntrance }) => (
  <CircleMarker
    key={`entrance_${selectedEntrance.id}`}
    center={{
      lat: selectedEntrance.latitude,
      lng: selectedEntrance.longitude,
    }}
    color="brown"
    fillColor="red"
    fillOpacity="1"
    weight="3"
    radius="12"
    onAdd={(e) => {
      e.target.openPopup();
    }}
  >
    <MapEntrancePopup entrance={selectedEntrance} />
  </CircleMarker>
);

MapSelectedEntranceMarker.propTypes = {
  selectedEntrance: PropTypes.shape({
    id: PropTypes.number.isRequired,
    latitude: PropTypes.number,
    longitude: PropTypes.number,
  }).isRequired,
};

export default MapSelectedEntranceMarker;
