import React from 'react';
import PropTypes from 'prop-types';
import CircularProgress from '@material-ui/core/CircularProgress';
import CavesList from '../common/cave/CavesList';

const Massif = (props) => {
  const { isFetching, massif } = props;
  if (isFetching) {
    return (<CircularProgress />);
  }
  if (massif) {
    return (
      <div>
        <h1>{massif.name}</h1>
        <CavesList caves={massif.caves} />
      </div>
    );
  }

  return <div />;
};

Massif.propTypes = {
  isFetching: PropTypes.bool.isRequired,
  massif: PropTypes.shape({}),
};
Massif.defaultProps = {
  massif: undefined,
};

export default Massif;
