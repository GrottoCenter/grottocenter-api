import React from 'react';
import PropTypes from 'prop-types';

// Classes used by Leaflet to position controls.
const POSITION_CLASSES = {
  bottomleft: 'leaflet-bottom leaflet-left',
  bottomright: 'leaflet-bottom leaflet-right',
  topleft: 'leaflet-top leaflet-left',
  topright: 'leaflet-top leaflet-right',
};

const CustomControl = ({
  position = 'topright',
  containerProps,
  children,
  style,
}) => (
  <div className={POSITION_CLASSES[position]} style={style}>
    <div className="leaflet-control leaflet-bar" {...containerProps}>
      {children}
    </div>
  </div>
);

export const customControlProps = {
  position: PropTypes.oneOf(Object.keys(POSITION_CLASSES)),
  // eslint-disable-next-line react/forbid-prop-types
  containerProps: PropTypes.any,
  children: PropTypes.node,
  // eslint-disable-next-line react/forbid-prop-types
  style: PropTypes.object,
};

CustomControl.propTypes = {
  ...customControlProps,
};

export default CustomControl;
