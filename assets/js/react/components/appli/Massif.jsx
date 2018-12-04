import React from 'react';
import PropTypes from 'prop-types';
import CircularProgress from '@material-ui/core/CircularProgress';
import Translate from '../common/Translate';
import GClink from '../common/GCLink';

const Massif = (props) => {
  const { isFetching, massif } = props;
  if (isFetching) {
    return (<CircularProgress />);
  }
  if (massif) {
    return (
      <div>
        <h1>{massif.name}</h1>

        <p>
          <b><Translate>Inscription date</Translate></b>
          :
          {' '}
          {new Date(massif.dateInscription).toLocaleDateString()}
          {' - '}
          {new Date(massif.dateInscription).toLocaleTimeString()}
          {' '}
          <Translate>by</Translate>
          {' '}
          <b>{massif.author.nickname}</b>
          <br />
          {massif.dateReviewed ? (
            <div>
              <b><Translate>Last reviewed</Translate></b>
            :
              {' '}
              {new Date(massif.dateReviewed).toLocaleDateString()}
              {' - '}
              {new Date(massif.dateReviewed).toLocaleTimeString()}
            </div>
          ) : ''}
        </p>

        {massif.caves.length > 0
          ? (
            <div>
              <b><Translate>Caves list</Translate></b>
              :
              <ul>
                {massif.caves.map(cave => (
                  <li key={cave.id}>
                    <GClink
                      href={`/ui/caves/${cave.id}`}
                      internal
                    >
                      {cave.name}
                    </GClink>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div>
              <Translate>This massif has no caves repertoried yet</Translate>
              .
            </div>
          )}
      </div>
    );
  }

  return <div />;
};

Massif.propTypes = {
  isFetching: PropTypes.bool.isRequired,
  massif: PropTypes.object,
};
Massif.defaultProps = {
  massif: undefined,
};

export default Massif;
