import React from 'react';
import PropTypes from 'prop-types';
import { CircleMarker, Tooltip } from 'react-leaflet';
import MapEntrancePopup from './MapEntrancePopup';

//
//
// M A I N - C O M P O N E N T
//
//

const MapEntranceMarker = ({ entrance }) => (
  <CircleMarker
    key={`entrance_${entrance.id}`}
    center={{
      lat: entrance.latitude,
      lng: entrance.longitude,
    }}
    color="white"
    fillColor="red"
    fillOpacity="1"
    weight="1"
    radius="8"
    onClick={(e) => {
      e.target.closeTooltip();
    }}
    onAdd={(e) => {
      e.target.bringToBack();
    }}
  >
    <MapEntrancePopup entrance={entrance} />
    <Tooltip direction="top">{entrance.name}</Tooltip>
  </CircleMarker>
);

MapEntranceMarker.propTypes = {
  entrance: PropTypes.shape({
    id: PropTypes.number.isRequired,
    latitude: PropTypes.number,
    longitude: PropTypes.number,
    name: PropTypes.string,
  }).isRequired,
};

export default MapEntranceMarker;
