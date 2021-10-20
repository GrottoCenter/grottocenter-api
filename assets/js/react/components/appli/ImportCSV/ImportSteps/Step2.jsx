import React, { useContext, useEffect, useState } from 'react';
import { CSVReader } from 'react-papaparse';
import { useTheme } from '@material-ui/core/styles';
import { Typography } from '@material-ui/core';
import { useIntl } from 'react-intl';
import { ImportPageContentContext } from '../Provider';
import checkData from '../checkData';

const inputRef = React.createRef();

const Step2 = () => {
  const { updateAttribute, selectedType } = useContext(
    ImportPageContentContext,
  );
  const theme = useTheme();
  const { formatMessage } = useIntl();

  const [errorsRow, setErrorsRow] = useState([]);

  const handleOnFileLoad = (data) => {
    const errors = checkData(data, selectedType, formatMessage);
    if (errors.length === 0) {
      updateAttribute('importData', data);
      updateAttribute('fileImported', true);
    } else {
      setErrorsRow(errors);
    }
  };

  const handleOnRemoveFile = () => {
    setErrorsRow([]);
    updateAttribute('fileImported', false);
  };

  const transformHeader = (header) => {
    return header.trim();
  };

  // react-papaparse reset its content if go back to that step, so do we.
  useEffect(() => {
    updateAttribute('importData', undefined);
    updateAttribute('fileImported', false);
  }, []);

  return (
    <>
      <CSVReader
        ref={inputRef}
        onFileLoad={handleOnFileLoad}
        onRemoveFile={handleOnRemoveFile}
        addRemoveButton
        isReset={false}
        progressBarColor={theme.palette.primary1Color}
        config={{
          transformHeader,
          header: true,
          skipEmptyLines: true,
        }}
      >
        <span>
          {formatMessage({ id: 'Drop CSV file here or click to upload.' })}
        </span>
      </CSVReader>
      {errorsRow.map((err) => (
        <Typography
          key={err}
        >{`Row ${err.row} : ${err.errorMessage}`}</Typography>
      ))}
    </>
  );
};

Step2.propTypes = {};

export default Step2;
