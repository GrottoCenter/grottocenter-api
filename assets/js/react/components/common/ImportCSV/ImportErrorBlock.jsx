import React from 'react';
import PropTypes from 'prop-types';
import { Alert } from '@material-ui/lab';
import { makeStyles } from '@material-ui/core';
import { useIntl } from 'react-intl';

const useStyles = makeStyles({
  alertError: {
    marginBottom: '0.2rem',
  },
});

const ImportErrorBlock = ({ errors }) => {
  const classes = useStyles();
  const { formatMessage } = useIntl();

  return (
    <>
      {Object.keys(errors).length !== 0 &&
        (Object.keys(errors).includes('header')
          ? Object.keys(errors.header).map((headerErrorKey) => {
              return (
                <Alert
                  key={headerErrorKey}
                  className={classes.alertError}
                  severity="error"
                >
                  {`${headerErrorKey} : ${formatMessage({
                    id: errors.header[headerErrorKey],
                  })}`}
                </Alert>
              );
            })
          : Object.keys(errors).map((errorKey) => {
              return (
                <Alert
                  key={errorKey}
                  className={classes.alertError}
                  severity="error"
                >
                  {`${errorKey} : ${formatMessage({
                    id: errors[errorKey],
                  })}`}
                </Alert>
              );
            }))}
    </>
  );
};
ImportErrorBlock.propTypes = {
  errors: PropTypes.shape({
    header: PropTypes.shape({}),
  }),
};

export default ImportErrorBlock;
