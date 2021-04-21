import React from 'react';
import { blue } from '@material-ui/core/colors';
import { CircleMarker } from 'react-leaflet';
import PropTypes from 'prop-types';

export const LocationMarker = ({ position }) => (
  <>
    <CircleMarker
      stroke={false}
      center={position}
      pathOptions={{ color: blue[700] }}
      radius={10}
      fillOpacity={0.3}
    />
    <CircleMarker
      fillOpacity={1}
      center={position}
      fillColor={blue[700]}
      radius={5}
      weight={1}
      color="white"
    />
  </>
);

LocationMarker.propTypes = {
  position: PropTypes.shape({
    lat: PropTypes.number,
    lng: PropTypes.number,
  }),
};

export default LocationMarker;
