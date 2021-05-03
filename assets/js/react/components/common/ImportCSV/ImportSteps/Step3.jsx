import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  Card,
  makeStyles,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
} from '@material-ui/core';
import { useIntl } from 'react-intl';
import styled from 'styled-components';
import SearchTableActions from '../../../homepage/advancedSearch/SearchTableActions';
import Translate from '../../Translate';
import { ImportPageContentContext } from '../Provider';

const DEFAULT_FROM = 0;
const DEFAULT_PAGE = 0;
const DEFAULT_SIZE = 10;

const useStyles = makeStyles({
  resultsContainer: {
    marginTop: '24px',
  },
  table: {
    marginBottom: 0,
    overflow: 'auto',
  },
  tableRow: {
    '&:hover': {
      cursor: 'pointer',
    },
  },
  textError: {
    color: '#ff3333',
  },
});

const HeaderIcon = styled.img`
  height: 3.6rem;
  vertical-align: middle;
  width: 3.6rem;
`;

const StyledTableFooter = styled.div`
  align-items: center;
  display: flex;
  justify-content: space-between;
  margin: ${({ theme }) => theme.spacing(2)}px;
`;

const Step3 = () => {
  const classes = useStyles();

  const [from, setFrom] = useState(DEFAULT_FROM);
  const [size, setSize] = useState(DEFAULT_SIZE);
  const [page, setPage] = useState(DEFAULT_PAGE);
  const { importData, selectedType } = useContext(ImportPageContentContext);
  const [results, setResults] = useState([]);
  const { formatMessage } = useIntl();

  const entrancesTableHead = () => (
    <TableHead>
      <TableRow>
        <TableCell color="inherit">
          <Translate>Cave</Translate>
        </TableCell>
        <TableCell color="inherit">
          <Translate>Name</Translate>
        </TableCell>
        <TableCell>
          <Translate>Country</Translate>
        </TableCell>
        <TableCell>
          <Translate>Description</Translate>
        </TableCell>
        <TableCell>
          <Translate>Location</Translate>
        </TableCell>
        <TableCell>
          <Translate>Coordinate Precision</Translate>
        </TableCell>
        <TableCell>
          <Translate>Latitude</Translate>
        </TableCell>
        <TableCell>
          <Translate>Longitude</Translate>
        </TableCell>
        <TableCell>
          <Translate>Altitude</Translate>
        </TableCell>
        <TableCell>
          <HeaderIcon
            src="/images/length.svg"
            title={formatMessage({
              id: 'Cave length',
              defaultMessage: 'Cave length',
            })}
            alt="Cave length icon"
          />
        </TableCell>
        <TableCell>
          <HeaderIcon
            src="/images/depth.svg"
            title={formatMessage({
              id: 'Cave depth',
              defaultMessage: 'Cave depth',
            })}
            alt="Cave depth icon"
          />
        </TableCell>
      </TableRow>
    </TableHead>
  );

  const documentsTableHead = () => (
    <TableHead>
      <TableRow>
        <TableCell>
          <Translate>Title</Translate>
        </TableCell>
        <TableCell>
          <Translate>Published in</Translate>
        </TableCell>
        <TableCell>
          <Translate>Subjects</Translate>
        </TableCell>
        <TableCell>
          <Translate>Editor</Translate>
        </TableCell>
        <TableCell>
          <Translate>Identifier</Translate>
        </TableCell>
        <TableCell>
          <Translate>Format</Translate>
        </TableCell>
        <TableCell>
          <Translate>Document type</Translate>
        </TableCell>
        <TableCell>
          <Translate>Main language</Translate>
        </TableCell>
        <TableCell>
          <Translate>Title and description language</Translate>
        </TableCell>
      </TableRow>
    </TableHead>
  );

  let ResultsTableHead;
  if (selectedType === 0) ResultsTableHead = entrancesTableHead;
  else ResultsTableHead = documentsTableHead;

  const cardRef = useRef();

  const getNewResults = (newFrom, currentSize) => {
    setResults(importData.slice(newFrom, newFrom + currentSize));
  };

  const handleRowClick = (id) => {
    let urlToRedirectTo = '';
    switch (selectedType) {
      case 0:
        urlToRedirectTo = `/ui/entries/${id}`;
        break;
      case 1:
        urlToRedirectTo = `/ui/documents/${id}`;
        break;
      default:
        break;
    }
    if (urlToRedirectTo !== '') {
      window.open(urlToRedirectTo, '_blank');
    }
  };

  const handleChangePage = (event, newPage) => {
    // Formula: From = Page * Size (size remains the same here)
    const newFrom = newPage * size;

    getNewResults(newFrom, size);

    setPage(newPage);
    setFrom(newFrom);
  };

  const handleChangeRowsPerPage = (event) => {
    /*
      Formula used here:
        Page = From / Size

      Size is changing here.
      So we need to calculate the new page and the new from.
    */
    const newSize = event.target.value;
    const newPage = Math.trunc(from / newSize);
    const newFrom = newPage * newSize;

    getNewResults(newFrom, newSize);

    setFrom(newFrom);
    setPage(newPage);
    setSize(newSize);
  };

  useEffect(() => {
    setResults(importData.slice(0, size));
  }, []);

  return (
    <Card className={classes.resultsContainer} ref={cardRef}>
      {importData.length > 0 ? (
        <>
          <Table
            className={classes.table}
            size="small"
            style={{ display: 'table' }}
          >
            <ResultsTableHead />
            <TableBody>
              {results.map((result) => (
                <TableRow
                  hover
                  key={result.id}
                  className={classes.tableRow}
                  onClick={() => handleRowClick(result.id)}
                >
                  {selectedType === 0 && (
                    <>
                      <TableCell>
                        {![null, undefined, ''].includes(result['rdfs:label'])
                          ? result['rdfs:label']
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {![null, undefined, ''].includes(result['rdfs:label'])
                          ? result['rdfs:label']
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {![null, undefined, ''].includes(
                          result['gn:countryCode'],
                        )
                          ? result['gn:countryCode']
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {![null, undefined, ''].includes(
                          result[
                            'karstlink:hasDescriptionDocument/dct:description'
                          ],
                        )
                          ? result[
                              'karstlink:hasDescriptionDocument/dct:description'
                            ]
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {![null, undefined, ''].includes(
                          result['karstlink:hasAccessDocument/dct:description'],
                        )
                          ? result[
                              'karstlink:hasAccessDocument/dct:description'
                            ]
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {![null, undefined, ''].includes(
                          result['dwc:coordinatePrecision'],
                        )
                          ? result['dwc:coordinatePrecision']
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {![null, undefined, ''].includes(
                          result['w3geo:latitude'],
                        )
                          ? result['w3geo:latitude']
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {![null, undefined, ''].includes(
                          result['w3geo:longitude'],
                        )
                          ? result['w3geo:longitude']
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {![null, undefined, ''].includes(
                          result['w3geo:altitude'],
                        )
                          ? result['w3geo:altitude']
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {![null, undefined, ''].includes(
                          result['karstlink:length'],
                        )
                          ? result['karstlink:length']
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {![null, undefined, ''].includes(
                          result['karstlink:verticalExtend'],
                        )
                          ? result['karstlink:verticalExtend']
                          : '-'}
                      </TableCell>
                    </>
                  )}
                  {selectedType === 1 && (
                    <>
                      <TableCell>
                        {![null, undefined, ''].includes(result['rdfs:label'])
                          ? result['rdfs:label']
                          : '-'}
                        {result.title}
                      </TableCell>
                      <TableCell>
                        {![null, undefined, ''].includes(result['dct:date'])
                          ? result['dct:date']
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {![null, undefined, ''].includes(result['dct:subject'])
                          ? result['dct:subject'].split('|').join(', ')
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {![null, undefined, ''].includes(
                          result['dct:publisher'],
                        )
                          ? result['dct:publisher']
                          : '-'}
                      </TableCell>

                      <TableCell>
                        {![null, undefined, ''].includes(result['dct:source'])
                          ? result['dct:source']
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {![null, undefined, ''].includes(result['dct:format'])
                          ? result['dct:format']
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {![null, undefined, ''].includes(
                          result['karstlink:documentType'],
                        )
                          ? result['karstlink:documentType']
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {![null, undefined, ''].includes(result['dc:language'])
                          ? result['dc:language']
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {![null, undefined, ''].includes(
                          result[
                            'karstlink:hasDescriptionDocument/dc:language'
                          ],
                        )
                          ? result[
                              'karstlink:hasDescriptionDocument/dc:language'
                            ]
                          : '-'}
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <StyledTableFooter>
            <TablePagination
              rowsPerPageOptions={[5, 10, 20]}
              component="div"
              count={importData.length}
              rowsPerPage={size}
              page={page}
              labelRowsPerPage={formatMessage({
                id: 'Results per page',
              })}
              onChangePage={(event, pageNb) => handleChangePage(event, pageNb)}
              onChangeRowsPerPage={(event) => handleChangeRowsPerPage(event)}
              ActionsComponent={() => (
                <SearchTableActions
                  page={page}
                  size={size}
                  onChangePage={handleChangePage}
                  count={importData.length}
                />
              )}
            />
          </StyledTableFooter>
        </>
      ) : (
        <>
          <Translate>No results</Translate>
        </>
      )}
    </Card>
  );
};
Step3.propTypes = {};

export default Step3;
