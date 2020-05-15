import React, { useContext } from 'react';
import { EntryContext } from './Provider';
import Map from '../../common/Maps/MultipleMarkers';

const EntryMap = () => {
  const {
    state: { position, loading },
  } = useContext(EntryContext);

  return <Map positions={[position]} loading={loading} />;
};

export default EntryMap;
