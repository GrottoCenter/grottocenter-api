import React from 'react';
import PropTypes from 'prop-types';
import CircularProgress from '@material-ui/core/CircularProgress';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CavesList from '../common/cave/CavesList';

const Massif = (props) => {
  const { isFetching, massif } = props;
  if (isFetching) {
    return (<CircularProgress />);
  }
  if (massif) {
    return (
      <Card>
        <CardContent>
          <h1>{massif.name}</h1>
          <CavesList caves={massif.caves} />
        </CardContent>
      </Card>
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
