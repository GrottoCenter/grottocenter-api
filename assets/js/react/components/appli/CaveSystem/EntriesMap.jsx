import React, { useContext } from 'react';
import { isNil, isEmpty, pipe, filter, includes } from 'ramda';

import Map from '../../common/Maps/MultipleMarkers';
import { CaveContext, getPositions } from './Provider';

const isSelected = (selection) => (entry) => includes(entry.id, selection);

const EntriesMap = () => {
  const {
    state: { coordinates, loading, selectedEntries, entries },
  } = useContext(CaveContext);

  const getPositionsToDisplay = () => {
    if (isNil(selectedEntries) || isEmpty(selectedEntries)) {
      return coordinates;
    }
    return pipe(filter(isSelected(selectedEntries)), getPositions)(entries);
  };

  return <Map positions={getPositionsToDisplay()} loading={loading} />;
};

export default EntriesMap;
