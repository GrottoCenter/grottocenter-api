import React from 'react';
import PropTypes from 'prop-types';
import {CircleMarker, Tooltip} from 'react-leaflet';
import MapEntryPopup from './MapEntryPopup';

//
//
// M A I N - C O M P O N E N T
//
//

const MapEntryMarker = ({ entry }) => (
  <CircleMarker
    key={`entry_${entry.id}`}
    center={{
      lat: entry.latitude,
      lng: entry.longitude,
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
    <MapEntryPopup
      entry={entry}
    />
    <Tooltip direction="top">{entry.name}</Tooltip>
  </CircleMarker>
);

MapEntryMarker.propTypes = {
  entry: PropTypes.object.isRequired,
};

export default MapEntryMarker;
