import React from 'react';
import PropTypes from 'prop-types';
import { CircleMarker } from 'react-leaflet';
import MapEntryPopup from './MapEntryPopup';

//
//
// M A I N - C O M P O N E N T
//
//

const MapSelectedEntryMarker = ({ selectedEntry }) => (
  <CircleMarker
    key={`entry_${selectedEntry.id}`}
    center={{
      lat: selectedEntry.latitude,
      lng: selectedEntry.longitude,
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
    <MapEntryPopup
      entry={selectedEntry}
    />
  </CircleMarker>
);

MapSelectedEntryMarker.propTypes = {
  selectedEntry: PropTypes.object.isRequired,
};

export default MapSelectedEntryMarker;
