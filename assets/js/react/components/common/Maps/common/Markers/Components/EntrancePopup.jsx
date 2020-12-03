import React from 'react';
import PropTypes from 'prop-types';
import { isNil } from 'ramda';
import { GpsFixed, Public } from '@material-ui/icons';
import { Property } from '../../../../Properties';
import CustomIcon from '../../../../CustomIcon';
import Title from './Title';
import { makeCoordinatesValue } from './utils';

export const EntrancePopup = ({ entrance }) => (
  <>
    <Title
      title={entrance.name && entrance.name.toUpperCase()}
      link={`/ui/entries/${entrance.id}`}
    />
    <Property
      secondary
      value={`${!isNil(entrance.city) && entrance.city}, ${!isNil(
        entrance.region,
      ) && entrance.region}`}
      icon={<Public color="primary" />}
    />
    <Property
      secondary
      value={makeCoordinatesValue(entrance.latitude, entrance.longitude)}
      icon={<GpsFixed color="primary" />}
    />
    {entrance.cave && entrance.cave.depth && (
      <Property
        secondary
        value={`${entrance.cave.depth} m`}
        icon={<CustomIcon size={25} type="depth" />}
      />
    )}
    {entrance.cave && entrance.cave.length && (
      <Property
        secondary
        value={`${entrance.cave.length} m`}
        icon={<CustomIcon size={25} type="length" />}
      />
    )}
  </>
);

EntrancePopup.propTypes = {
  entrance: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string,
    region: PropTypes.string,
    city: PropTypes.string,
    longitude: PropTypes.number,
    latitude: PropTypes.number,
    cave: PropTypes.shape({
      name: PropTypes.string,
      depth: PropTypes.number,
      length: PropTypes.number,
    }),
  }).isRequired,
};

export default EntrancePopup;
