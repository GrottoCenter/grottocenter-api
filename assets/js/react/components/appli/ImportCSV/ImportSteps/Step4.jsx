import React, { useContext, useEffect } from 'react';
import { makeStyles, Typography } from '@material-ui/core';
import PublishIcon from '@material-ui/icons/Publish';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import styled from 'styled-components';
import { ImportPageContentContext } from '../Provider';
import {
  checkRowsInBdd,
  importRows,
  resetImportState,
} from '../../../../actions/ImportCsv';
import DownloadButtons from '../DownloadButtons';
import ActionButton from '../../../common/ActionButton';
import { ENTRANCE } from '../constants';

const useStyles = makeStyles({
  cardBottomButtons: {
    display: 'block',
    marginTop: `${({ theme }) => theme.spacing(2)}px`,
    marginBottom: `${({ theme }) => theme.spacing(2)}px`,
    padding: 0,
    textAlign: 'center',
    width: '100%',
  },

  bottomButton: {
    margin: `${({ theme }) => theme.spacing(2)}px`,
  },
});

const Title = styled.div`
  font-size: 2rem;
`;

const SecondaryTypo = styled.p`
  color: ${({ theme }) => theme.palette.secondary.main};
`;

const SuccessTypo = styled.p`
  color: ${({ theme }) => theme.palette.successColor};
`;

const ErrorTypo = styled.p`
  color: ${({ theme }) => theme.palette.errorColor};
`;

const Step4 = () => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  const importCsv = useSelector((state) => state.importCsv);
  const { importData, selectedType } = useContext(ImportPageContentContext);

  const willBeCreatedData = importCsv.resultCheck.willBeCreated;
  const wontBeCreateData = importCsv.resultCheck.wontBeCreated;
  const { resultImport } = importCsv;

  const handleOnClick = () => {
    dispatch(importRows(willBeCreatedData, selectedType));
  };

  useEffect(() => {
    dispatch(checkRowsInBdd(selectedType, importData));
    return () => {
      dispatch(resetImportState());
    };
  }, []);

  const WontBeCreatedData = () => {
    const { resultCheck } = importCsv;
    const linesArray = [];
    if (resultCheck && resultCheck.wontBeCreated.length > 0) {
      resultCheck.wontBeCreated.forEach((row) => {
        linesArray.push(row.line);
      });
    }

    return (
      <ErrorTypo className={classes.errorTypo}>
        {formatMessage(
          {
            id: 'duplicates found import csv',
            defaultMessage: 'Lines concerned : {lines}.',
          },
          { lines: linesArray.toString() },
        )}
      </ErrorTypo>
    );
  };

  return (
    <>
      <Title>
        {formatMessage({
          id:
            'The functionality to check for duplicates has not been fully implemented. Please be careful not to import any documents or entrances which are already present in Grottocenter.',
        })}
      </Title>
      {importCsv.isLoading && (
        <Typography>
          {formatMessage({ id: 'Processing, this may take some time...' })}
        </Typography>
      )}

      {importCsv.error && <Typography>{importCsv.error}</Typography>}

      {wontBeCreateData && wontBeCreateData.length > 0 && (
        <>
          <ErrorTypo className={classes.errorTypo}>
            {formatMessage(
              {
                id: 'importCsv not imported',
                defaultMessage:
                  "{nbDouble} {typeData} are already present in Grottocenter and won't be imported.",
              },
              {
                nbDouble: wontBeCreateData.length,
                typeData: selectedType === ENTRANCE ? 'entrances' : 'documents',
              },
            )}
          </ErrorTypo>
          <WontBeCreatedData />
        </>
      )}

      {willBeCreatedData && willBeCreatedData.length > 0 && (
        <>
          <SecondaryTypo>
            {formatMessage(
              {
                id: 'importCsv imported',
                defaultMessage: '{nbNew} {typeData} will be imported.',
              },
              {
                nbNew: willBeCreatedData.length,
                typeData: selectedType === ENTRANCE ? 'entrances' : 'documents',
              },
            )}
          </SecondaryTypo>
          <div className={classes.cardBottomButtons}>
            <ActionButton
              label={formatMessage({ id: 'Import' })}
              onClick={handleOnClick}
              loading={importCsv.isLoading}
              icon={<PublishIcon />}
            />
          </div>
        </>
      )}

      {resultImport && (
        <DownloadButtons
          successfulImport={resultImport.successfulImport}
          failureImport={resultImport.failureImport}
        />
      )}

      {resultImport && resultImport.total.success > 0 && (
        <>
          <SuccessTypo className={classes.successTypo}>
            {formatMessage(
              {
                id: 'success import csv',
                defaultMessage: '{nbNew} {typeData} were imported',
              },
              {
                nbNew: resultImport.total.success,
                typeData: selectedType === ENTRANCE ? 'entrances' : 'documents',
              },
            )}
          </SuccessTypo>
        </>
      )}
      {resultImport && resultImport.total.failure > 0 && (
        <>
          <ErrorTypo className={classes.errorType}>
            {formatMessage(
              {
                id: 'failure import csv',
                defaultMessage: '{nb} {typeData} were not imported',
              },
              {
                nb: resultImport.total.failure,
                typeData: selectedType === ENTRANCE ? 'entrances' : 'documents',
              },
            )}
          </ErrorTypo>
        </>
      )}
    </>
  );
};

Step4.propTypes = {};

export default Step4;
