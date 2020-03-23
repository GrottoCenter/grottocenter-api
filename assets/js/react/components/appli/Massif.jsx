import React from 'react';
import PropTypes from 'prop-types';

import { Typography, CircularProgress, Card, CardContent } from '@material-ui/core';

import CavesList from '../common/cave/CavesList';
import EntriesList from '../common/entry/EntriesList';
import Translate from '../common/Translate';

// ==========

export class Massif extends React.Component {
  componentDidMount() {
    const { updatePageTitle } = this.props;
    updatePageTitle('Massif');
  }

  render = () => {
    const { isFetching, massif } = this.props;

    if (isFetching) {
      return <CircularProgress />;
    }

    if (massif) {
      return (
        <Card>
          <CardContent>
            <Typography variant="h1">{massif.name}</Typography>
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
}

Massif.propTypes = {
  isFetching: PropTypes.bool.isRequired,
  massif: PropTypes.shape({}),
  updatePageTitle: PropTypes.func.isRequired,
};
Massif.defaultProps = {
  massif: undefined,
};

export default Massif;
