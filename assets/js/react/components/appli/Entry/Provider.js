import React, { useState, createContext, useEffect } from 'react';
import PropTypes from 'prop-types';
import { pathOr } from 'ramda';

const date = new Date();
const todayDate = date.toISOString().substring(0, 10);
const defaultContext = {
  state: {
    details: {
      id: 0,
      name: 'Cavitée',
      localisation: 'France',
      depth: 100,
      development: 100,
      interestRate: 2.5,
      progressionRate: 2.5,
      accessRate: 2.5,
      author: 'Author name',
      creationDate: todayDate,
    },
    position: [51.505, -0.09],
  },
};

export const EntryContext = createContext(defaultContext);

const Entry = ({ details, loading = true, children }) => {
  const [detailsState, setState] = useState(defaultContext);

  useEffect(() => {
    setState({
      name: pathOr('Name', ['name'], details),
      localisation: pathOr('Localisation', ['localisation'], details),
      depth: pathOr(0, ['depth'], details),
      development: pathOr(0, ['development'], details),
      interestRate: pathOr(0, ['interestRate'], details),
      progressionRate: pathOr(0, ['progressionRate'], details),
      accessRate: pathOr(0, ['accessRate'], details),
      author: pathOr('Author', ['author'], details),
      creationDate: pathOr(todayDate, ['creationDate'], details),
      coordinates: pathOr([0, 0], ['coordinates'], details),
      ...details,
    });
  }, [details]);

  return (
    <EntryContext.Provider
      value={{
        state: {
          loading,
          details: detailsState,
          position: pathOr(null, ['coordinates'], details),
        },
        action: {},
      }}
    >
      {children}
    </EntryContext.Provider>
  );
};

export const detailsType = PropTypes.shape({
  id: PropTypes.number,
  name: PropTypes.string,
  localisation: PropTypes.string,
  depth: PropTypes.number,
  development: PropTypes.number,
  interestRate: PropTypes.number,
  progressionRate: PropTypes.number,
  accessRate: PropTypes.number,
  author: PropTypes.string,
  creationDate: PropTypes.string,
  coordinates: PropTypes.arrayOf(PropTypes.number),
  lastEditor: PropTypes.string,
  editionDate: PropTypes.string,
  undergroundType: PropTypes.string,
  discoveryYear: PropTypes.number,
  mountain: PropTypes.string,
  altitude: PropTypes.number,
  isDivingCave: PropTypes.bool,
});

export const positionType = PropTypes.arrayOf(PropTypes.number);

Entry.propTypes = {
  details: detailsType.isRequired,
  loading: PropTypes.bool,
  children: PropTypes.node.isRequired,
};

export default Entry;
