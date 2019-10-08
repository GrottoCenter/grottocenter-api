import React from 'react';
import PropTypes from 'prop-types';
import CircularProgress from '@material-ui/core/CircularProgress';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CavesList from '../common/cave/CavesList';
import EntriesList from '../common/entry/EntriesList';
import Translate from '../common/Translate';

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
          <CavesList
            caves={massif.caves}
            emptyMessage={<Translate>This massif has no caves repertoried yet</Translate>}
          />
          <EntriesList
            entries={massif.entries}
            emptyMessage={<Translate>This massif has no entries repertoried yet</Translate>}
          />
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
