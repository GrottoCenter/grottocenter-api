import React, { useContext, useState } from 'react';
import { makeStyles } from '@material-ui/core';
import { DropzoneArea } from 'material-ui-dropzone';
import { useIntl } from 'react-intl';
import CSVDataValidator from '../CSVDataValidator';
import ImportErrorBlock from '../ImportErrorBlock';
import { ImportPageContentContext } from '../Provider';
import { errorsDictionary } from '../Helper';

const useStyles = makeStyles({
  dropzone: {
    marginTop: '0.8rem',
  },

  previewChip: {
    minWidth: 160,
    maxWidth: 210,
    color: 'black',
  },
});

const Step2 = () => {
  const classes = useStyles();
  const { formatMessage } = useIntl();
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const { updateAttribute } = useContext(ImportPageContentContext);

  const makeErrorMessages = (errorObj) => {
    const result = {};

    Object.keys(errorObj).forEach((key) => {
      const currentError = errorObj[key];
      if (key === 'header') {
        result.header = {};
        Object.keys(currentError).forEach((headerKey) => {
          result.header[headerKey] = errorsDictionary[currentError[headerKey]];
        });
      } else result[key] = errorsDictionary[currentError];
    });

    return result;
  };

  const handleErrors = (errorObj) => {
    const errorMessages = makeErrorMessages(errorObj);
    setErrors(errorMessages);
    updateAttribute('baseErrors', errorMessages);
  };

  const handleSelectedFile = (value) => {
    if (file !== null) {
      setErrors({});
      updateAttribute('baseErrors', {});
      updateAttribute('fileImported', false);
    }
    if (value[0]) {
      setFile(value[0]);
      updateAttribute('fileImported', true);
    }
  };

  return (
    <>
      <ImportErrorBlock errors={errors} />
      <DropzoneArea
        filesLimit={1}
        dropzoneText={formatMessage({
          id: 'Drag and drop a file here or click',
        })}
        acceptedFiles={['.csv']}
        maxFileSize={5000000}
        onChange={handleSelectedFile}
        dropzoneClass={classes.dropzone}
        showPreviews
        showPreviewsInDropzone={false}
        useChipsForPreview
        previewGridProps={{ container: { spacing: 2, direction: 'row' } }}
        previewChipProps={{ classes: { root: classes.previewChip } }}
        previewText={formatMessage({
          id: 'Selected files',
        })}
      />
      <CSVDataValidator selectedFile={file} errorHandler={handleErrors} />
    </>
  );
};
Step2.propTypes = {};

export default Step2;
