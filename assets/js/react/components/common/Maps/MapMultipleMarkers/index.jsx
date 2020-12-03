import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  is,
  pipe,
  length,
  equals,
  all,
  allPass,
  flatten,
  isNil,
  isEmpty,
} from 'ramda';
import { useMap } from 'react-leaflet';
import CustomMapContainer from '../common/MapContainer';
import useMarkers from '../common/Markers/useMarkers';
import { EntranceMarker } from '../common/Markers/Components';

const isPair = pipe(length, equals(2));
const isNumber = pipe(flatten, all(is(Number)));
export const isValidPositions = allPass([
  is(Array),
  all(is(Array)),
  all(isPair),
  isNumber,
]);

const makePosition = (pos) => ({ latitude: pos[0], longitude: pos[1] });

const MultipleMarkers = ({ positions }) => {
  const map = useMap();
  const updateEntranceMarkers = useMarkers(EntranceMarker);

  useEffect(() => {
    updateEntranceMarkers(positions.map(makePosition));
    if (!isNil(positions) && !isEmpty(positions)) {
      map.fitBounds(positions);
    }
  }, [positions]);

  return null;
};

const HydratedMultipleMarkers = (props) => (
  <CustomMapContainer
    wholePage={false}
    dragging={false}
    viewport={null}
    scrollWheelZoom={false}
    zoom={14}
  >
    <MultipleMarkers {...props} />
  </CustomMapContainer>
);

// eslint-disable-next-line no-multi-assign
HydratedMultipleMarkers.propTypes = MultipleMarkers.propTypes = {
  positions: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)).isRequired,
  loading: PropTypes.bool,
};

export default HydratedMultipleMarkers;
