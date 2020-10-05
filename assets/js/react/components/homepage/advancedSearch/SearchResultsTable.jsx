/* eslint-disable no-nested-ternary */
import React from 'react';
import PropTypes from 'prop-types';
import { injectIntl, intlShape } from 'react-intl';
import { withStyles } from '@material-ui/core/styles';
import { withRouter } from 'react-router-dom';
import { isMobile } from 'react-device-detect';
import styled from 'styled-components';
import DescriptionIcon from '@material-ui/icons/Description';
import {
  Button,
  Card,
  CircularProgress,
  Table,
  TableCell,
  TableBody,
  TableHead,
  TablePagination,
  TableRow,
} from '@material-ui/core';
import { pathOr } from 'ramda';

import { CSVDownload } from 'react-csv';
import _ from 'lodash';

import Translate from '../../common/Translate';

import SearchTableActions from './SearchTableActions';

const StyledTableFooter = styled.div`
  align-items: center;
  display: flex;
  justify-content: space-between;
  margin: ${({ theme }) => theme.spacing(2)}px;
`;

const styles = () => ({
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

const DEFAULT_FROM = 0;
const DEFAULT_PAGE = 0;
const DEFAULT_SIZE = 10;
// Don't authorize anyone to download all the database in CSV
const MAX_NUMBER_OF_DATA_TO_EXPORT_IN_CSV = 10000;

const HeaderIcon = styled.img`
  height: 3.6rem;
  vertical-align: middle;
  width: 3.6rem;
`;

// ============= MAIN COMPONENT ============= //

class SearchResultsTable extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      from: DEFAULT_FROM,
      page: DEFAULT_PAGE,
      size: DEFAULT_SIZE,
    };
    this.entrancesTableHead = this.entrancesTableHead.bind(this);
    this.groupsTableHead = this.groupsTableHead.bind(this);
    this.massifsTableHead = this.massifsTableHead.bind(this);
    this.documentsTableHead = this.documentsTableHead.bind(this);
    this.handleRowClick = this.handleRowClick.bind(this);
    this.loadCSVData = this.loadCSVData.bind(this);
    this.getFullResultsAsCSV = this.getFullResultsAsCSV.bind(this);
  }

  // ============================== //

  // If the results are empty, the component must
  // get back to the initial pagination state.
  componentDidUpdate = () => {
    const { results } = this.props;
    const { from, page, size } = this.state;

    if (
      !results &&
      (from !== DEFAULT_FROM || page !== DEFAULT_PAGE || size !== DEFAULT_SIZE)
    ) {
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({
        from: DEFAULT_FROM,
        page: DEFAULT_PAGE,
        size: DEFAULT_SIZE,
      });
    }
  };

  // ===== Table headers ===== //
  entrancesTableHead = () => {
    const { intl } = this.props;
    return (
      <TableHead>
        <TableRow>
          <TableCell color="inherit">
            <Translate>Name</Translate>
          </TableCell>
          <TableCell>
            <Translate>Country</Translate>
          </TableCell>
          <TableCell>
            <Translate>Massif name</Translate>
          </TableCell>
          <TableCell>
            <Translate>Aesthetic</Translate>
          </TableCell>
          <TableCell>
            <Translate>Ease of move</Translate>
          </TableCell>
          <TableCell>
            <Translate>Ease of reach</Translate>
          </TableCell>
          <TableCell>
            <Translate>Network name</Translate>
          </TableCell>
          <TableCell>
            <HeaderIcon
              src="/images/length.svg"
              title={intl.formatMessage({
                id: 'Cave length',
                defaultMessage: 'Cave length',
              })}
              alt="Cave length icon"
            />
          </TableCell>
          <TableCell>
            <HeaderIcon
              src="/images/depth.svg"
              title={intl.formatMessage({
                id: 'Cave depth',
                defaultMessage: 'Cave depth',
              })}
              alt="Cave depth icon"
            />
          </TableCell>
        </TableRow>
      </TableHead>
    );
  };

  groupsTableHead = () => {
    const { intl } = this.props;
    return (
      <TableHead>
        <TableRow>
          <TableCell>
            <Translate>Name</Translate>
          </TableCell>
          <TableCell>
            <Translate>Email</Translate>
          </TableCell>
          <TableCell>
            <Translate>City</Translate>
          </TableCell>
          <TableCell>
            <Translate>County</Translate>
          </TableCell>
          <TableCell>
            <Translate>Region</Translate>
          </TableCell>
          <TableCell>
            <Translate>Country</Translate>
          </TableCell>
          <TableCell>
            <HeaderIcon
              src="/images/caver-cluster.svg"
              title={intl.formatMessage({
                id: 'Number of cavers',
                defaultMessage: 'Number of cavers',
              })}
              alt="Cavers icon"
            />
          </TableCell>
        </TableRow>
      </TableHead>
    );
  };

  massifsTableHead = () => {
    const { intl } = this.props;
    return (
      <TableHead>
        <TableRow>
          <TableCell>
            <Translate>Name</Translate>
          </TableCell>
          <TableCell>
            <HeaderIcon
              src="/images/entry-cluster.svg"
              title={intl.formatMessage({
                id: 'Number of caves',
                defaultMessage: 'Number of caves',
              })}
              alt="Cave icon"
            />
          </TableCell>
          <TableCell>
            <HeaderIcon
              src="/images/gc-entries.svg"
              title={intl.formatMessage({
                id: 'Number of entrances',
                defaultMessage: 'Number of entrances',
              })}
              alt="Entrances icon"
            />
          </TableCell>
        </TableRow>
      </TableHead>
    );
  };

  documentsTableHead = () => (
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
          <Translate>Country or region</Translate>
        </TableCell>
        <TableCell>
          <Translate>Authors</Translate>
        </TableCell>
        <TableCell>
          <Translate>Year</Translate>
        </TableCell>
      </TableRow>
    </TableHead>
  );

  // ===== Handle functions ===== //

  handleRowClick = (id) => {
    const { history, resourceType } = this.props;
    let urlToRedirectTo = '';
    switch (resourceType) {
      case 'entrances':
        urlToRedirectTo = `/ui/entries/${id}`;
        break;
      case 'grottos':
        urlToRedirectTo = `/ui/groups/${id}`;
        break;
      case 'massifs':
        urlToRedirectTo = `/ui/massifs/${id}`;
        break;
      case 'documents':
        // C. ROIG 05/10/2020
        // Temporarly disabled, document page in progress...
        // urlToRedirectTo = `/ui/bbs/${id}`;
        break;
      default:
        break;
    }
    if (urlToRedirectTo !== '') {
      // Different behaviour if on mobile or not (better UX)
      if (isMobile) {
        history.push(urlToRedirectTo);
      } else {
        window.open(urlToRedirectTo, '_blank');
      }
    }
  };

  handleChangePage = (event, newPage) => {
    const { results, getNewResults, totalNbResults } = this.props;

    const { from, size } = this.state;

    // Formula: From = Page * Size (size remains the same here)
    const newFrom = newPage * size;

    /* Load new results if not enough already loaded:
      - click next page
      - results.length < totalNbResults (not ALL results already loaded)
      - results.length < newFrom + size (results on the asked page 
          are not loaded)
    */
    if (
      newFrom > from &&
      results.length < totalNbResults &&
      results.length < newFrom + size
    ) {
      getNewResults(newFrom, size);
    }

    this.setState({
      page: newPage,
      from: newFrom,
    });
  };

  handleChangeRowsPerPage = (event) => {
    const { results, getNewResults, totalNbResults } = this.props;
    const { from } = this.state;

    /*
      Formula used here:
        Page = From / Size

      Size is changing here.
      So we need to calculate the new page and the new from.
    */
    const newSize = event.target.value;
    const newPage = Math.trunc(from / newSize);
    const newFrom = newPage * newSize;

    /* Load new results if not enough already loaded:
      - results.length < totalNbResults (not ALL results already loaded)
      - results.length < newFrom + newSize (not enough results loaded)
    */
    if (results.length < totalNbResults && results.length < newFrom + newSize) {
      getNewResults(newFrom, newSize);
    }

    this.setState({
      from: newFrom,
      page: newPage,
      size: newSize,
    });
  };

  // ===== CSV Export
  loadCSVData = () => {
    const { getFullResults } = this.props;
    getFullResults();
  };

  getFullResultsAsCSV = () => {
    const { resourceType, fullResults } = this.props;
    let cleanedResults;
    switch (resourceType) {
      case 'entrances':
        // Flatten cave and massif
        cleanedResults = fullResults.map((result) => {
          const cleanedResult = result;
          cleanedResult.cave = result.cave.name;
          cleanedResult.massif = result.massif.name;
          delete cleanedResult.type;
          delete cleanedResult.highlights;
          return cleanedResult;
        });
        break;

      case 'grottos':
      case 'massifs':
        cleanedResults = fullResults.map((result) => {
          const cleanedResult = result;
          delete cleanedResult.type;
          delete cleanedResult.highlights;
          return cleanedResult;
        });
        break;

      case 'documents':
        // Flatten regions and subjects
        cleanedResults = fullResults.map((result) => {
          const cleanedResult = result;
          if (result.regions) {
            cleanedResult.regions = result.regions
              .map((s) => {
                return s.names;
              })
              .join(', ');
          }
          if (result.subjects) {
            cleanedResult.subjects = result.subjects
              .map((s) => {
                return s.code;
              })
              .join(', ');
          }
          delete cleanedResult.type;
          delete cleanedResult.highlights;
          return cleanedResult;
        });
        break;

      default:
    }

    return cleanedResults;
  };

  // ===== Render ===== //

  render() {
    const {
      classes,
      isLoading,
      results,
      resourceType,
      totalNbResults,
      isLoadingFullData,
      wantToDownloadCSV,
      fullResults,
      intl,
    } = this.props;
    const { from, page, size } = this.state;

    let ResultsTableHead;
    if (resourceType === 'entrances')
      ResultsTableHead = this.entrancesTableHead;
    if (resourceType === 'grottos') ResultsTableHead = this.groupsTableHead;
    if (resourceType === 'massifs') ResultsTableHead = this.massifsTableHead;
    if (resourceType === 'documents')
      ResultsTableHead = this.documentsTableHead;

    const canDownloadDataAsCSV =
      totalNbResults <= MAX_NUMBER_OF_DATA_TO_EXPORT_IN_CSV;
    /*
      When the component is loading the new page, we want to keep the
      previous results displayed (instead of a white board).
      That's why we check if the slice asked by the user is returning more
      than 0 results: if not, we keep the old results.
    */
    let resultsSliced = results;
    if (resultsSliced) {
      resultsSliced = results.slice(from, from + size);
      if (resultsSliced.length === 0) {
        resultsSliced = results.slice(results.length - size, results.length);
      }
    }

    /* 
      For small screens, change the display property to allow horizontal scroll.
      Screen smaller than 1200px AND results type not "massif"
        => scrollable table (display: "block")
      (for massif, no scroll needed because the results are not very large)
    */
    const tableDisplayValueForScroll =
      window.innerWidth < 1200 && resourceType !== 'massifs'
        ? 'block'
        : 'table';

    return resultsSliced !== undefined && resourceType !== '' ? (
      <Card className={classes.resultsContainer}>
        {resultsSliced.length > 0 ? (
          <>
            <Table
              className={classes.table}
              size="small"
              style={{ display: tableDisplayValueForScroll }}
            >
              <ResultsTableHead />

              <TableBody
                style={{
                  opacity: isLoading ? 0.3 : 1,
                }}
              >
                {resultsSliced.map((result) => (
                  <TableRow
                    hover
                    key={result.id}
                    className={classes.tableRow}
                    onClick={() => this.handleRowClick(result.id)}
                  >
                    {resourceType === 'entrances' && (
                      <>
                        <TableCell>{result.name}</TableCell>
                        <TableCell>
                          {result.countryCode ? result.countryCode : '-'}
                        </TableCell>
                        <TableCell>
                          {pathOr('-', ['massif', 'name'], result)}
                        </TableCell>
                        <TableCell>
                          {result.aestheticism
                            ? Number(result.aestheticism.toFixed(1))
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {result.caving
                            ? Number(result.caving.toFixed(1))
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {result.approach
                            ? Number(result.approach.toFixed(1))
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {pathOr('-', ['cave', 'name'], result)}
                        </TableCell>
                        <TableCell>
                          {result.cave && result.cave.length
                            ? `${result.cave.length}m`
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {result.cave && result.cave.depth
                            ? `${result.cave.depth}m`
                            : '-'}
                        </TableCell>
                      </>
                    )}
                    {resourceType === 'grottos' && (
                      <>
                        <TableCell>{result.name}</TableCell>
                        <TableCell>{result.mail ? result.mail : '-'}</TableCell>
                        <TableCell>{result.city ? result.city : '-'}</TableCell>
                        <TableCell>
                          {result.county ? result.county : '-'}
                        </TableCell>
                        <TableCell>
                          {result.region ? result.region : '-'}
                        </TableCell>
                        <TableCell>
                          {result.countryCode ? result.countryCode : '-'}
                        </TableCell>
                        <TableCell>
                          {result.nbCavers ? result.nbCavers : '0'}
                        </TableCell>
                      </>
                    )}
                    {resourceType === 'massifs' && (
                      <>
                        <TableCell>{result.name}</TableCell>
                        <TableCell>
                          {result.nbCaves ? result.nbCaves : '0'}
                        </TableCell>
                        <TableCell>
                          {result.nbEntrances ? result.nbEntrances : '0'}
                        </TableCell>
                      </>
                    )}
                    {resourceType === 'documents' && (
                      <>
                        <TableCell>{result.title}</TableCell>
                        <TableCell>
                          {result.publication ? result.publication : '-'}
                        </TableCell>
                        <TableCell>
                          {result.subjects
                            ? result.subjects.map((s) => s.code).join(', ')
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {result.regions
                            ? _.truncate(
                                result.regions.map((s) => s.name).join(', '),
                                30,
                              )
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {result.authors ? result.authors : '-'}
                        </TableCell>
                        <TableCell>
                          {result.publicationDate
                            ? new Date(result.publicationDate).getFullYear()
                            : '-'}
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <StyledTableFooter>
              <Button
                disabled={!canDownloadDataAsCSV}
                type="button"
                variant="contained"
                size="large"
                onClick={this.loadCSVData}
                startIcon={<DescriptionIcon />}
              >
                <Translate>Export to CSV</Translate>
              </Button>

              {!isLoadingFullData &&
              fullResults.length === totalNbResults &&
              wantToDownloadCSV ? (
                <CSVDownload data={this.getFullResultsAsCSV()} target="_self" />
              ) : (
                ''
              )}

              <TablePagination
                rowsPerPageOptions={[5, 10, 20]}
                component="div"
                count={totalNbResults}
                rowsPerPage={size}
                page={page}
                labelRowsPerPage={intl.formatMessage({
                  id: 'Results per page',
                })}
                onChangePage={(event, pageNb) =>
                  this.handleChangePage(event, pageNb)
                }
                onChangeRowsPerPage={(event) =>
                  this.handleChangeRowsPerPage(event)
                }
                ActionsComponent={() => (
                  <SearchTableActions
                    page={page}
                    size={size}
                    onChangePage={this.handleChangePage}
                    count={totalNbResults}
                  />
                )}
              />
            </StyledTableFooter>

            {isLoadingFullData ? (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <CircularProgress style={{ marginRight: '5px' }} />
                <Translate>Loading full data, please wait...</Translate>
              </div>
            ) : (
              ''
            )}
            {!canDownloadDataAsCSV ? (
              <>
                <p className={classes.textError}>
                  <Translate
                    id="Too many results to download ({0}). You can only download {1} results at once."
                    defaultMessage="Too many results to download ({0}). You can only download {1} results at once."
                    values={{
                      0: <b>{totalNbResults}</b>,
                      1: <b>{MAX_NUMBER_OF_DATA_TO_EXPORT_IN_CSV}</b>,
                    }}
                  />
                </p>
              </>
            ) : (
              ''
            )}
          </>
        ) : (
          <Translate>No results</Translate>
        )}
      </Card>
    ) : (
      ''
    );
  }
}

SearchResultsTable.propTypes = {
  classes: PropTypes.shape({
    resultsContainer: PropTypes.string,
    table: PropTypes.string,
    tableRow: PropTypes.string,
    textError: PropTypes.string,
  }).isRequired,
  history: PropTypes.shape({ push: PropTypes.func }).isRequired,
  isLoading: PropTypes.bool.isRequired,
  isLoadingFullData: PropTypes.bool.isRequired,
  results: PropTypes.arrayOf(PropTypes.shape({})),
  resourceType: PropTypes.oneOf([
    '',
    'entrances',
    'grottos',
    'massifs',
    'documents',
  ]).isRequired,
  getNewResults: PropTypes.func.isRequired,
  getFullResults: PropTypes.func.isRequired,
  wantToDownloadCSV: PropTypes.bool.isRequired,
  totalNbResults: PropTypes.number.isRequired,
  fullResults: PropTypes.arrayOf(PropTypes.shape({})),
  intl: PropTypes.shape(intlShape).isRequired,
};

SearchResultsTable.defaultProps = {
  results: undefined,
  fullResults: undefined,
};

export default injectIntl(withRouter(withStyles(styles)(SearchResultsTable)));
