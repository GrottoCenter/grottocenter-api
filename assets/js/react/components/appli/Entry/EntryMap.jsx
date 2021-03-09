import React, { useContext } from 'react';
import { isNil } from 'ramda';
import { EntryContext } from './Provider';
import Map from '../../common/Maps/MapMultipleMarkers';

const EntryMap = () => {
  const {
    state: { position, loading },
  } = useContext(EntryContext);

  return (
    <Map positions={isNil(position) ? [] : [position]} loading={loading} />
  );
};

export default EntryMap;
