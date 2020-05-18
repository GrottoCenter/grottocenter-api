import React, { useState, createContext, useEffect } from 'react';
import PropTypes from 'prop-types';
import { pipe, pluck, reject, isNil } from 'ramda';

import { detailsType as entryDetailsType } from '../Entry/Provider';

const date = new Date();
const todayDate = date.toISOString().substring(0, 10);

export const getPositions = pipe(pluck('coordinates'), reject(isNil));

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
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  name: PropTypes.string,
  localisation: PropTypes.string,
  depth: PropTypes.number,
  development: PropTypes.number,
  interestRate: PropTypes.number,
  progressionRate: PropTypes.number,
  accessRate: PropTypes.number,
  author: PropTypes.string,
  creationDate: PropTypes.string,
  lastEditor: PropTypes.string,
  editionDate: PropTypes.string,
  undergroundType: PropTypes.string,
  discoveryYear: PropTypes.number,
  mountain: PropTypes.string,
  altitude: PropTypes.number,
  isDivingCave: PropTypes.bool,
  temperature: PropTypes.number,
  entries: PropTypes.arrayOf(entryDetailsType),
});

Provider.propTypes = {
  data: caveTypes.isRequired,
  loading: PropTypes.bool,
  children: PropTypes.node.isRequired,
};

export default Provider;
