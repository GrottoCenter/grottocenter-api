import React, { useContext, useEffect, useState } from 'react';
import { Breakpoint } from 'react-socks';
import { Button, makeStyles, Snackbar } from '@material-ui/core';
import ImportExportIcon from '@material-ui/icons/ImportExport';
import { useDispatch, useSelector } from 'react-redux';
import getCountryISO3 from 'country-iso-2-to-3';
import { Alert } from '@material-ui/lab';
import { useIntl } from 'react-intl';
import Translate from '../../Translate';
import { postEntry } from '../../../../actions/CreateEntry';
import { postCave } from '../../../../actions/CreateCave';
import { postDocument } from '../../../../actions/CreateDocument';
import { fetchQuicksearchResult } from '../../../../actions/Quicksearch';
import { ImportPageContentContext } from '../Provider';

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

const Step4 = () => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  const { cave } = useSelector((state) => state.createCave);
  const { results } = useSelector((state) => state.quicksearch);
  const { importData, selectedType } = useContext(ImportPageContentContext);

  const [currentRow, setCurrentRow] = useState([]);
  const [errors, setErrors] = useState([]);
  const [openToast, setOpenToast] = useState(false);
  const [buttonDisabled, setButtonDisabled] = useState(false);

  const getDocumentType = (url) => {
    if (url.includes('art', 'article')) return 18;
    if (url.includes('doc', 'document')) return 12;
    if (url.includes('img', 'image')) return 4;
    return 18;
  };

  const iso2ToIso3 = (iso) => {
    if (iso !== undefined) {
      if (iso === 'EN') return 'eng';
      return getCountryISO3(iso).toLowerCase();
    }
    return null;
  };

  const getURIValue = (string) => {
    return string.split('#')[1].replace('_', ' ');
  };

  const importEntranceRow = (row) => {
    dispatch(
      postCave({
        name: row['rdfs:label'],
        language: iso2ToIso3(
          row['karstlink:hasDescriptionDocument/dc:language'],
        ),
        latitude: row['w3geo:latitude'],
        longitude: row['w3geo:longitude'],
        length: row['karstlink:length'],
        depth:
          row['karstlink:verticalExtend'] !== ''
            ? parseInt(row['karstlink:verticalExtend'], 10)
            : parseInt(row['karstlink:extendBelowEntrance'], 10) +
              parseInt(row['karstlink:extendAboveEntrance'], 10),
      }),
    );
  };

  const importDocumentRow = (row) => {
    dispatch(
      fetchQuicksearchResult({
        query: getURIValue(row['dct:creator']),
        resourceTypes: ['cavers'],
      }),
    );
  };

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }

    setOpenToast(false);
  };

  const handleOnClick = () => {
    importData.forEach((row) => {
      setCurrentRow(row);
      if (selectedType === 0) {
        importEntranceRow(row);
      } else {
        importDocumentRow(row);
      }
    });
    setOpenToast(true);
    setButtonDisabled(true);
  };

  useEffect(() => {
    if (results.length === 0 && currentRow.length !== 0) {
      setErrors([...errors, 'Author not found']);
    }

    if (
      results.length !== 0 &&
      results[0].type === 'caver' &&
      currentRow.length !== 0
    ) {
      dispatch(
        postDocument({
          document: currentRow,
          titleAndDescriptionLanguage: {
            id: iso2ToIso3(
              currentRow['karstlink:hasDescriptionDocument/dc:language'],
            ),
          },
          language: iso2ToIso3(currentRow['dc:language']),
          description:
            currentRow['karstlink:hasDescriptionDocument/dct:description'],
          type: getDocumentType(currentRow['karstlink:documentType']),
          author: { id: results[0].id },
        }),
      );
    }
  }, [results]);

  useEffect(() => {
    if (cave !== null && selectedType === 0 && currentRow.length !== 0) {
      dispatch(
        postEntry({
          cave,
          description: {
            body:
              currentRow['karstlink:hasDescriptionDocument/dct:description'],
            language: iso2ToIso3(
              currentRow['karstlink:hasDescriptionDocument/dc:language'],
            ),
            title: currentRow['karstlink:hasDescriptionDocument/dct:title'],
          },
          name: {
            text: currentRow['rdfs:label'],
            language: iso2ToIso3(currentRow['gn:countryCode']),
          },
          location: {
            body: currentRow['karstlink:hasAccessDocument/dct:description'],
            language: iso2ToIso3(
              currentRow['karstlink:hasAccessDocument/dc:language'],
            ),
          },
          country: {
            id: currentRow['gn:countryCode'],
          },
          precision: parseInt(currentRow['dwc:coordinatePrecision'], 10),
          altitude: parseInt(currentRow['w3geo:altitude'], 10),
        }),
      );
    }
  }, [cave]);

  return (
    <>
      {errors.length !== 0
        ? errors.map((error) => {
            return (
              <Alert
                key={Math.random()}
                className={classes.alertError}
                severity="error"
              >
                {formatMessage({
                  id: error,
                })}
              </Alert>
            );
          })
        : null}
      {errors.length === 0 && (
        <Snackbar
          open={openToast}
          autoHideDuration={6000}
          onClose={handleClose}
        >
          <Alert onClose={handleClose} variant="filled" severity="success">
            {importData.length}
            {formatMessage({
              id: ' rows imported, thanks for the contribution.',
            })}
          </Alert>
        </Snackbar>
      )}
      <div className={classes.cardBottomButtons}>
        <Breakpoint customQuery="(max-width: 450px)">
          <Button
            className={classes.bottomButtonSmallScreen}
            type="submit"
            variant="contained"
            size="large"
            onClick={handleOnClick}
            disabled={buttonDisabled}
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
            disabled={buttonDisabled}
          >
            <ImportExportIcon />
            <Translate>Import</Translate>
          </Button>
        </Breakpoint>
      </div>
    </>
  );
};

Step4.propTypes = {};

export default Step4;
