import React, { useContext, useEffect } from 'react';
import { Breakpoint } from 'react-socks';
import { Button, makeStyles, Typography } from '@material-ui/core';
import ImportExportIcon from '@material-ui/icons/ImportExport';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import Translate from '../../Translate';
import { ImportPageContentContext } from '../Provider';
import { checkRowsInBdd, importRows, resetImportState } from '../../../../actions/ImportCsv';
import styled from 'styled-components';

const useStyles = makeStyles({
  cardBottomButtons: {
    display: 'block',
    marginTop: '10px',
    marginBottom: '10px',
    padding: 0,
    textAlign: 'center',
    width: '100%',
  },

  bottomButton: {
    margin: '0 4px',
  },

  bottomButtonSmallScreen: {
    marginBottom: '10px',
    width: '100%',
  },

  alertError: {
    marginBottom: '0.2rem',
  },
});

const Title = styled.div`
  font-size: 2rem;
`;

const GreenTypography = styled.div`
  color: green;
`;

const RedTypography = styled.div`
  color: red;
`;

const Step4 = () => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  const importCsv = useSelector((state) => state.importCsv);
  const { importData, selectedType } = useContext(ImportPageContentContext);

  const handleOnClick = () => {
    dispatch(importRows(importCsv.resultCheck.willBeCreated, selectedType));
  };

  useEffect(() => {
    dispatch(checkRowsInBdd(selectedType, importData));
    return () => {
      dispatch(resetImportState());
    }
  },[])

  const errorMessages = () => {
    const resultImport = importCsv.resultImport;
    const errorsArray = [];
    if (resultImport && resultImport.failureImport.length > 0) {
      resultImport.failureImport.forEach((row) => {
        errorsArray.push(<RedTypography>{formatMessage(
          {id: 'failure import csv message', defaultMessage: 'Line {line} : {errorMessage}.'},
          {line : row.line, errorMessage: row.message }
        )}</RedTypography>);
      })
    }
    return errorsArray;
  }
  
  const wontBeCreatedData = () => {
    const resultCheck = importCsv.resultCheck;
    const linesArray = [];
    if(resultCheck && resultCheck.wontBeCreated.length > 0){
      resultCheck.wontBeCreated.forEach((row) => {
        linesArray.push(row.line);
      });
    }

    return <RedTypography>{formatMessage(
      {id: 'duplicates found import csv', defaultMessage: 'Lines concerned : {lines}.'}, 
      {lines: linesArray.toString()}
      )}
      </RedTypography>;
  }


    return (
      <>
        <Title>
          {formatMessage({id: 'The functionality to check for duplicates has not been fully implemented. Please be careful not to import any documents or entrances which are already present in Grottocenter.'})}
        </Title>
        {importCsv.isLoading && <Typography>{formatMessage({id: 'Processing, this may take some time...'})}</Typography>}
        
        {importCsv.error && <Typography>{importCsv.error}</Typography>}

        {importCsv.resultCheck.wontBeCreated && importCsv.resultCheck.wontBeCreated.length > 0 && 
        (<>
          <RedTypography>
            {formatMessage(
              {id: 'importCsv not imported', defaultMessage: '{nbDouble} {typeData} are already present in Grottocenter and won\'t be imported.'},
              {nbDouble: importCsv.resultCheck.wontBeCreated.length, typeData: selectedType == 0 ? 'entrances' : 'documents'}
            )}
          </RedTypography>
          {wontBeCreatedData()}
          </>)
      }
        
        {importCsv.resultCheck.willBeCreated && importCsv.resultCheck.willBeCreated.length > 0 &&
        (<>
          <GreenTypography>
            {formatMessage(
              {id: 'importCsv imported', defaultMessage: '{nbNew} {typeData} will be imported.'},
              {nbNew : importCsv.resultCheck.willBeCreated.length, typeData: selectedType == 0 ? 'entrances' : 'documents'}
            )}
          </GreenTypography>
          <div className={classes.cardBottomButtons}>
          <Breakpoint customQuery="(max-width: 450px)">
            <Button
              className={classes.bottomButtonSmallScreen}
              type="submit"
              variant="contained"
              size="large"
              onClick={handleOnClick}
              disabled={importCsv.isLoading}
            >
              <ImportExportIcon />
              <Translate>Import</Translate>
            </Button>
          </Breakpoint>

          <Breakpoint customQuery="(min-width: 451px)">
            <Button
              className={classes.bottomButton}
              type="submit"
              variant="contained"
              size="large"
              onClick={handleOnClick}
              disabled={importCsv.isLoading}
            >
              <ImportExportIcon />
              <Translate>Import</Translate>
            </Button>
          </Breakpoint>
        </div>
      </>)
      }

      {importCsv.resultImport && importCsv.resultImport.total.success > 0 &&
      (<>
        <GreenTypography>
            {formatMessage(
              {id: 'success import csv', defaultMessage: '{nbNew} {typeData} has been imported'},
              {nbNew : importCsv.resultImport.total.success, typeData: selectedType == 0 ? 'entrances' : 'documents'}
            )}
        </GreenTypography>
      </>)
      }
      {importCsv.resultImport && importCsv.resultImport.total.failure > 0 &&
      (<>
          <RedTypography>
            {formatMessage(
              {id: 'failure import csv', defaultMessage: '{nb} {typeData} has not been imported'},
              {nb : importCsv.resultImport.total.failure, typeData: selectedType == 0 ? 'entrances' : 'documents'}
            )}
          </RedTypography>
          {errorMessages()}
      </>)
      }
      </>
    );
};

Step4.propTypes = {};

export default Step4;
