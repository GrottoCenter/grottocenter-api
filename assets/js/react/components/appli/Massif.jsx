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
import Translate from '../common/Translate';

const Massif = ({ isFetching, massif }) => {
  const { formatMessage } = useIntl();

  if (isNil(massif) && !isFetching) {
    return (
      <Translate>
        Error, the massif data you are looking for is not available.
      </Translate>
    );
  }

  return (
    <>
      {isFetching ? (
        <CircularProgress />
      ) : (
        <Card>
          <CardHeader
            title={
              <Typography variant="h1" color="secondary">
                {massif.name}
              </Typography>
            }
          />
          <CardContent>
            <CavesList
              caves={massif.caves}
              emptyMessageComponent={formatMessage({
                id: 'This massif has no caves listed yet',
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
  }),
};
Massif.defaultProps = {
  massif: undefined,
};

export default Massif;
