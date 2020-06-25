import React from 'react';
import PropTypes from 'prop-types';
import { isNil } from 'ramda';
import {
  Typography,
  CircularProgress,
  Card,
  CardContent,
  CardHeader,
} from '@material-ui/core';
import { useIntl } from 'react-intl';

import CavesList from '../common/cave/CavesList';
import EntriesList from '../common/entry/EntriesList';

const Massif = ({ isFetching, massif }) => {
  const { formatMessage } = useIntl();

  return (
    <>
      {isFetching || isNil(massif) ? (
        <CircularProgress />
      ) : (
        <Card>
          <CardHeader
            title={
              <Typography variant="h5" color="secondary">
                {massif.name}
              </Typography>
            }
          />
          <CardContent>
            <CavesList
              caves={massif.caves}
              emptyMessage={formatMessage({
                id: 'This massif has no caves listed yet',
              })}
            />
            <EntriesList
              entries={massif.entries}
              emptyMessage={formatMessage({
                id: 'This massif has no entries listed yet',
              })}
            />
          </CardContent>
        </Card>
      )}
    </>
  );
};

Massif.propTypes = {
  isFetching: PropTypes.bool.isRequired,
  massif: PropTypes.shape({
    name: PropTypes.string,
    caves: PropTypes.arrayOf(PropTypes.object),
    entries: PropTypes.arrayOf(PropTypes.object),
  }),
};
Massif.defaultProps = {
  massif: undefined,
};

export default Massif;
