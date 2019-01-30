/* eslint-disable no-nested-ternary */

import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import { withRouter } from 'react-router-dom';
import { Card, CardContent } from '@material-ui/core';
import styled from 'styled-components';

import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TablePagination from '@material-ui/core/TablePagination';
import TableRow from '@material-ui/core/TableRow';

import Translate from '../../common/Translate';

import SearchTableActions from './SearchTableActions';

// =================== STYLES ========================

const StyledTablePagination = withStyles(() => ({
  root: {
    fontSize: '1.2rem',
  },
  caption: {
    fontSize: '1.2rem',
  },
}))(TablePagination);

const StyledTableCell = withStyles(() => ({
  root: {
    fontSize: '1.2rem',
    textAlign: 'center',
  },
}))(TableCell);

const StyledTableHeadRowCell = withStyles(() => ({
  root: {
    fontSize: '1.3rem',
    fontWeight: 'bold',
    color: '#eee',
    textAlign: 'center',
  },
}))(TableCell);

const StyledTableRow = withStyles(theme => ({
  root: {
    height: '3rem',
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
      cursor: 'pointer',
    },
  },
}))(TableRow);

const StyledTableHeadRow = withStyles(theme => ({
  root: {
    backgroundColor: theme.palette.primary.light,
  },
}))(TableRow);

const styles = () => ({
  resultsContainer: {
    marginTop: '24px',
  },
  table: {
    marginBottom: 0,
  },
});

const DEFAULT_FROM = 0;
const DEFAULT_PAGE = 0;
const DEFAULT_SIZE = 10;

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
    this.entriesTableHead = this.entriesTableHead.bind(this);
    this.groupsTableHead = this.groupsTableHead.bind(this);
    this.massifsTableHead = this.massifsTableHead.bind(this);
    this.handleRowClick = this.handleRowClick.bind(this);
  }

  // ============================== //

   // If the results are empty, the component must get back to the initial pagination state.
   componentDidUpdate = () => {
     const { results } = this.props;
     const { from, page, size } = this.state;

     if (!results && (from !== DEFAULT_FROM || page !== DEFAULT_PAGE || size !== DEFAULT_SIZE)
     ) {
       this.setState({
         from: DEFAULT_FROM,
         page: DEFAULT_PAGE,
         size: DEFAULT_SIZE,
       });
     }
   }

  // ===== Table headers ===== //
  entriesTableHead = () => {
    const { intl } = this.context;
    return (
      <TableHead>
        <StyledTableHeadRow>
          <StyledTableHeadRowCell>
            <Translate>Name</Translate>
          </StyledTableHeadRowCell>
          <StyledTableHeadRowCell>
            <Translate>Country</Translate>
          </StyledTableHeadRowCell>
          <StyledTableHeadRowCell>
            <Translate>Massif name</Translate>
          </StyledTableHeadRowCell>
          <StyledTableHeadRowCell>
            <Translate>Aesthetic</Translate>
          </StyledTableHeadRowCell>
          <StyledTableHeadRowCell>
            <Translate>Ease of move</Translate>
          </StyledTableHeadRowCell>
          <StyledTableHeadRowCell>
            <Translate>Ease of reach</Translate>
          </StyledTableHeadRowCell>
          <StyledTableHeadRowCell>
            <Translate>Network name</Translate>
          </StyledTableHeadRowCell>
          <StyledTableHeadRowCell>
            <HeaderIcon
              src="/images/length.svg"
              title={intl.formatMessage({ id: 'Cave length', defaultMessage: 'Cave length' })}
              alt="Cave length icon"
            />
          </StyledTableHeadRowCell>
          <StyledTableHeadRowCell>
            <HeaderIcon
              src="/images/depth.svg"
              title={intl.formatMessage({ id: 'Cave depth', defaultMessage: 'Cave depth' })}
              alt="Cave depth icon"
            />
          </StyledTableHeadRowCell>
        </StyledTableHeadRow>
      </TableHead>
    );
  };

  groupsTableHead = () => {
    const { intl } = this.context;
    return (
      <TableHead>
        <StyledTableHeadRow>
          <StyledTableHeadRowCell><Translate>Name</Translate></StyledTableHeadRowCell>
          <StyledTableHeadRowCell><Translate>Contact</Translate></StyledTableHeadRowCell>
          <StyledTableHeadRowCell><Translate>City</Translate></StyledTableHeadRowCell>
          <StyledTableHeadRowCell><Translate>County</Translate></StyledTableHeadRowCell>
          <StyledTableHeadRowCell><Translate>Region</Translate></StyledTableHeadRowCell>
          <StyledTableHeadRowCell><Translate>Country</Translate></StyledTableHeadRowCell>
          <StyledTableHeadRowCell>
            <HeaderIcon
              src="/images/caver-cluster.svg"
              title={intl.formatMessage({ id: 'Number of cavers', defaultMessage: 'Number of cavers' })}
              alt="Cavers icon"
            />
          </StyledTableHeadRowCell>
        </StyledTableHeadRow>
      </TableHead>
    );
  };

  massifsTableHead = () => {
    const { intl } = this.context;
    return (
      <TableHead>
        <StyledTableHeadRow>
          <StyledTableHeadRowCell><Translate>Name</Translate></StyledTableHeadRowCell>
          <StyledTableHeadRowCell>
            <HeaderIcon
              src="/images/entry-cluster.svg"
              title={intl.formatMessage({ id: 'Number of caves', defaultMessage: 'Number of caves' })}
              alt="Caves icon"
            />
          </StyledTableHeadRowCell>
          <StyledTableHeadRowCell>
            <HeaderIcon
              src="/images/gc-entries.svg"
              title={intl.formatMessage({ id: 'Number of entries', defaultMessage: 'Number of entries' })}
              alt="Entries icon"
            />
          </StyledTableHeadRowCell>
        </StyledTableHeadRow>
      </TableHead>
    );
  };

  // ===== Handle functions ===== //

  handleRowClick = (id) => {
    const { history, resourceType, resetAdvancedSearch } = this.props;
    resetAdvancedSearch();
    if (resourceType === 'entries') history.push(`/ui/entries/${id}`);
    if (resourceType === 'grottos') history.push(`/ui/groups/${id}`);
    if (resourceType === 'massifs') history.push(`/ui/massifs/${id}`);
  }

  handleChangePage = (event, newPage) => {
    const {
      results, getNewResults, totalNbResults,
    } = this.props;

    const {
      from, size,
    } = this.state;

    // Formula: From = Page * Size (size remains the same here)
    const newFrom = newPage * size;

    /* Load new results if not enough already loaded:
      - click next page
      - results.length < totalNbResults (not ALL results already loaded)
      - results.length < newFrom + size (results on the asked page are not loaded)
    */
    if (newFrom > from
      && results.length < totalNbResults
      && results.length < newFrom + size
    ) {
      getNewResults(
        newFrom,
        size,
      );
    }

    this.setState({
      page: newPage,
      from: newFrom,
    });
  }

  handleChangeRowsPerPage = (event) => {
    const {
      results, getNewResults, totalNbResults,
    } = this.props;
    const {
      from,
    } = this.state;

    /*
      Formula used here:
        Page = From / Size

      Size is changing here so we need to calculate the new page and the new from.
    */
    const newSize = event.target.value;
    const newPage = Math.trunc(from / newSize);
    const newFrom = newPage * newSize;

    /* Load new results if not enough already loaded:
      - results.length < totalNbResults (not ALL results already loaded)
      - results.length < newFrom + newSize (not enough results loaded)
    */
    if (results.length < totalNbResults
      && results.length < newFrom + newSize
    ) {
      getNewResults(
        newFrom,
        newSize,
      );
    }

    this.setState({
      from: newFrom,
      page: newPage,
      size: newSize,
    });
  }

  // ===== Render ===== //

  render() {
    const {
      classes, isLoading, results, resourceType, totalNbResults,
    } = this.props;

    const { from, page, size } = this.state;

    let ResultsTableHead;
    if (resourceType === 'entries') ResultsTableHead = this.entriesTableHead;
    if (resourceType === 'grottos') ResultsTableHead = this.groupsTableHead;
    if (resourceType === 'massifs') ResultsTableHead = this.massifsTableHead;

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

    return (
      (resultsSliced !== undefined && resourceType !== '' ? (
        <Card className={classes.resultsContainer}>
          <CardContent>
            {resultsSliced.length > 0 ? (
              <React.Fragment>
                <Table className={classes.table}>
                  <ResultsTableHead />

                  <TableBody style={{
                    opacity: isLoading ? 0.3 : 1,
                  }}
                  >

                    {resultsSliced
                      .map(result => (
                        <StyledTableRow
                          key={result.id}
                          className={classes.tableRow}
                          onClick={() => this.handleRowClick(result.id)}
                        >
                          {(resourceType === 'entries' && (
                            <React.Fragment>
                              <StyledTableCell>{result.name}</StyledTableCell>
                              <StyledTableCell>{result.country ? result.country : '-'}</StyledTableCell>
                              <StyledTableCell>{result.massif.name ? result.massif.name : '-'}</StyledTableCell>
                              <StyledTableCell>{result.aestheticism ? Number(result.aestheticism.toFixed(1)) : '-'}</StyledTableCell>
                              <StyledTableCell>{result.caving ? Number(result.caving.toFixed(1)) : '-'}</StyledTableCell>
                              <StyledTableCell>{result.approach ? Number(result.approach.toFixed(1)) : '-'}</StyledTableCell>
                              <StyledTableCell>{result.cave.name ? result.cave.name : '-'}</StyledTableCell>
                              <StyledTableCell>{result.cave.length ? `${result.cave.length}m` : '-'}</StyledTableCell>
                              <StyledTableCell>{result.cave.depth ? `${result.cave.depth}m` : '-'}</StyledTableCell>
                            </React.Fragment>
                          ))}
                          {(resourceType === 'grottos' && (
                          <React.Fragment>
                            <StyledTableCell>{result.name}</StyledTableCell>
                            <StyledTableCell>{result.contact ? result.contact : '-'}</StyledTableCell>
                            <StyledTableCell>{result.city ? result.city : '-'}</StyledTableCell>
                            <StyledTableCell>{result.county ? result.county : '-'}</StyledTableCell>
                            <StyledTableCell>{result.region ? result.region : '-'}</StyledTableCell>
                            <StyledTableCell>{result.country ? result.country : '-'}</StyledTableCell>
                            <StyledTableCell>{result.cavers ? result.cavers.length : '0'}</StyledTableCell>
                          </React.Fragment>
                          ))}
                          {(resourceType === 'massifs' && (
                          <React.Fragment>
                            <StyledTableCell>{result.name}</StyledTableCell>
                            <StyledTableCell>{result.caves ? result.caves.length : '0'}</StyledTableCell>
                            <StyledTableCell>{result.entries ? result.entries.length : '0'}</StyledTableCell>
                          </React.Fragment>
                          ))}
                        </StyledTableRow>
                      ))}

                  </TableBody>
                </Table>

                <StyledTablePagination
                  rowsPerPageOptions={[5, 10, 20]}
                  component="div"
                  count={totalNbResults}
                  rowsPerPage={size}
                  page={page}
                  backIconButtonProps={{
                    'aria-label': 'Previous Page',
                  }}
                  nextIconButtonProps={{
                    'aria-label': 'Next Page',
                  }}
                  labelRowsPerPage={<Translate>Results per page</Translate>}
                  onChangePage={(event, pageNb) => this.handleChangePage(event, pageNb)}
                  onChangeRowsPerPage={event => this.handleChangeRowsPerPage(event)}
                  ActionsComponent={() => (
                    <SearchTableActions
                      page={page}
                      size={size}
                      onChangePage={this.handleChangePage}
                      count={totalNbResults}
                    />
                  )}
                />

              </React.Fragment>
            ) : (
              <Translate>No results</Translate>
            )
            }
          </CardContent>
        </Card>
      ) : (
        ''
      ))

    );
  }
}

SearchResultsTable.propTypes = {
  classes: PropTypes.shape({}).isRequired,
  history: PropTypes.shape({ push: PropTypes.func }).isRequired,
  isLoading: PropTypes.bool.isRequired,
  resetAdvancedSearch: PropTypes.func.isRequired,
  results: PropTypes.arrayOf(PropTypes.shape({})),
  resourceType: PropTypes.oneOf(['', 'entries', 'grottos', 'massifs']).isRequired,
  getNewResults: PropTypes.func.isRequired,
  totalNbResults: PropTypes.number.isRequired,
};

SearchResultsTable.defaultProps = {
  results: undefined,
};

SearchResultsTable.contextTypes = {
  intl: PropTypes.shape({}).isRequired,
};

export default withRouter(withStyles(styles)(SearchResultsTable));
