import React from 'react';
import { CSVDownloader } from 'react-papaparse';
import { useIntl } from 'react-intl';
import { makeStyles } from '@material-ui/core';

const useStyles = makeStyles((theme) => ({
  button: {
    margin: `${theme.spacing(3)}px`,
  },
}));

const DownloadButtons = ({ successfulImport, failureImport }) => {
  const classes = useStyles();
  const { formatMessage } = useIntl();

  return (
    <>
      {successfulImport.length > 0 && (
        <CSVDownloader
          data={successfulImport}
          type="button"
          filename="importGCsuccess"
          className={classes.button}
        >
          {formatMessage({ id: 'Download success' })}
        </CSVDownloader>
      )}
      {failureImport.length > 0 && (
        <CSVDownloader
          data={failureImport}
          type="button"
          filename="importGCfailure"
          className={classes.button}
        >
          {formatMessage({ id: 'Download failure' })}
        </CSVDownloader>
      )}
    </>
  );
};

export default DownloadButtons;
