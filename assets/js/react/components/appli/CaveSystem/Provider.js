import React, { useState, createContext, useEffect } from 'react';
import PropTypes from 'prop-types';
import { pipe, reject, isNil, map, prop } from 'ramda';

import { detailsType as entryDetailsType } from '../Entry/Provider';

const date = new Date();
const todayDate = date.toISOString().substring(0, 10);

export const getPositions = pipe(
  map((entry) => [prop('latitude', entry), prop('longitude', entry)]),
  reject(isNil),
);

const defaultContext = {
  state: {
    cave: {
      id: 0,
      name: 'Cave System',
      localisation: '',
      depth: 0,
      development: 0,
      interestRate: 0,
      progressionRate: 0,
      accessRate: 0,
      author: '',
      creationDate: todayDate,
    },
    entries: null,
    coordinates: null,
  },
};

export const CaveContext = createContext(defaultContext);

const Provider = ({ data, loading = true, children }) => {
  const { entries, ...caveData } = data;
  const [caveState, setCaveState] = useState(caveData || null);
  const [coordinatesState, setCoordinatesState] = useState(
    getPositions(entries),
  );
  const [entriesState, setEntriesState] = useState(entries || null);
  const [selectedEntries, setSelectedEntries] = useState([]);

  useEffect(() => {
    setCaveState(caveData);
    setEntriesState(entries || null);
    setCoordinatesState(getPositions(entries));
  }, [data]);

  const onSelectEntry = (selection) => {
    if (!isNil(selection)) {
      setSelectedEntries(selection);
    }
  };

  const handleOpenEntryMap = (entryId) => {
    if (!isNil(entryId)) {
      // TODO
      window.open(`/ui/map`, '_blank');
    }
  };
  const handleOpenEntryDescription = (entryId) => {
    if (!isNil(entryId)) {
      window.open(`/ui/entries/${entryId}`, '_blank');
    }
  };

  return (
    <CaveContext.Provider
      value={{
        state: {
          loading,
          cave: caveState,
          coordinates: coordinatesState,
          entries: entriesState,
          selectedEntries,
        },
        action: {
          onSelectEntry,
          openEntryMap: handleOpenEntryMap,
          openEntryDescription: handleOpenEntryDescription,
        },
      }}
    >
      {children}
    </CaveContext.Provider>
  );
};

export const caveTypes = PropTypes.shape({
  accessRate: PropTypes.number,
  altitude: PropTypes.number,
  author: PropTypes.string,
  creationDate: PropTypes.string,
  depth: PropTypes.number,
  development: PropTypes.number,
  discoveryYear: PropTypes.number,
  editionDate: PropTypes.string,
  entries: PropTypes.arrayOf(entryDetailsType),
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  interestRate: PropTypes.number,
  isDivingCave: PropTypes.bool,
  lastEditor: PropTypes.string,
  localisation: PropTypes.string,
  mountain: PropTypes.string,
  name: PropTypes.string,
  progressionRate: PropTypes.number,
  temperature: PropTypes.number,
  undergroundType: PropTypes.string,
});

Provider.propTypes = {
  data: caveTypes.isRequired,
  loading: PropTypes.bool,
  children: PropTypes.node.isRequired,
};

export default Provider;
