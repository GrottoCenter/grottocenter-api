/* eslint-disable no-nested-ternary */
import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import { withRouter } from 'react-router-dom';

import { Card, CardContent } from '@material-ui/core';
import CircularProgress from '@material-ui/core/CircularProgress';

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
    margin: '24px',
  },
  table: {
    marginBottom: 0,
  },
});

const DEFAULT_PAGE = 0;
const DEFAULT_ROWS_PER_PAGE = 10;


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
      page: DEFAULT_PAGE,
      rowsPerPage: DEFAULT_ROWS_PER_PAGE,
    };
    this.entriesTableHead = this.entriesTableHead.bind(this);
    this.groupsTableHead = this.groupsTableHead.bind(this);
    this.massifsTableHead = this.massifsTableHead.bind(this);
    this.handleRowClick = this.handleRowClick.bind(this);
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
            <Translate>Cave name</Translate>
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

  groupsTableHead = () => (
    <TableHead>
      <StyledTableHeadRow>
        <TableCell><Translate>Name</Translate></TableCell>
        <TableCell><Translate>Country</Translate></TableCell>
        <TableCell><Translate>Massif</Translate></TableCell>
        <TableCell><Translate>Aesthetic</Translate></TableCell>
        <TableCell><Translate>Ease of move</Translate></TableCell>
        <TableCell><Translate>Ease of reach</Translate></TableCell>
        <TableCell><Translate>Cave length</Translate></TableCell>
        <TableCell><Translate>Cave depth</Translate></TableCell>
      </StyledTableHeadRow>
    </TableHead>
  );

  massifsTableHead = () => (
    <TableHead>
      <StyledTableHeadRow>
        <TableCell><Translate>Name</Translate></TableCell>
        <TableCell><Translate>Country</Translate></TableCell>
        <TableCell><Translate>Massif</Translate></TableCell>
        <TableCell><Translate>Aesthetic</Translate></TableCell>
        <TableCell><Translate>Ease of move</Translate></TableCell>
        <TableCell><Translate>Ease of reach</Translate></TableCell>
        <TableCell><Translate>Cave length</Translate></TableCell>
        <TableCell><Translate>Cave depth</Translate></TableCell>
      </StyledTableHeadRow>
    </TableHead>
  );

  // ============================== //

  // If the results are empty, the component must get back to the initial pagination state.
  componentDidUpdate = () => {
    const { results } = this.props;
    const { page, rowsPerPage } = this.state;

    if (!results && (page !== DEFAULT_PAGE || rowsPerPage !== DEFAULT_ROWS_PER_PAGE)
    ) {
      this.setState({
        page: DEFAULT_PAGE,
        rowsPerPage: DEFAULT_ROWS_PER_PAGE,
      });
    }
  }

  // ===== Handle functions ===== //

  handleRowClick = (id) => {
    const { history, resourceType, resetAdvancedSearch } = this.props;
    resetAdvancedSearch();
    if (resourceType === 'entries') history.push(`/ui/entries/${id}`);
    if (resourceType === 'groups') history.push(`/ui/groups/${id}`);
    if (resourceType === 'massifs') history.push(`/ui/massifs/${id}`);
  }

  handleChangePage = (event, newPage) => {
    const {
      results, getNewResults, totalNbResults,
    } = this.props;
    const { page, rowsPerPage } = this.state;

    /* Load new results if not enough already loaded:
      - click next page
      - totalNbResults > results.length (not ALL results already loaded)
      - rowsPerpage + rowsPerPage * page > results.length (results on the asked page are not loaded)
    */
    if (newPage > page
      && totalNbResults > results.length
      && rowsPerPage + rowsPerPage * newPage > results.length
    ) {
      getNewResults(
        rowsPerPage,
      );
    }
    this.setState({ page: newPage });
  }

  handleChangeRowsPerPage = (event) => {
    const {
      results, getNewResults, totalNbResults,
    } = this.props;
    const { page } = this.state;

    const newRowsPerPage = event.target.value;

    /* Load new results if not enough already loaded:
      - totalNbResults > results.length (not ALL results already loaded)
      - newRowsPerPage + newRowsPerPage * page > results.length
        (results on the asked page are not loaded)
    */
    if (totalNbResults > results.length
      && newRowsPerPage + newRowsPerPage * page > results.length
    ) {
      getNewResults(
        newRowsPerPage,
      );
    }
    this.setState({ rowsPerPage: event.target.value });
  }

  // ===== Render ===== //

  render() {
    const {
      classes, isLoading, results, resourceType, totalNbResults,
    } = this.props;

    const { page, rowsPerPage } = this.state;

    let ResultsTableHead;
    if (resourceType === 'entries') ResultsTableHead = this.entriesTableHead;
    if (resourceType === 'groups') ResultsTableHead = this.groupsTableHead;
    if (resourceType === 'massifs') ResultsTableHead = this.massifsTableHead;

    return (
      (results !== undefined && resourceType !== '' ? (
        <Card className={classes.resultsContainer}>
          <CardContent>
            {isLoading ? (
              <CircularProgress />
            ) : (
              results.length > 0 ? (
                <React.Fragment>
                  <Table className={classes.table}>
                    <ResultsTableHead />
                    <TableBody>

                      {results
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map(result => (
                          <StyledTableRow
                            key={result.id}
                            className={classes.tableRow}
                            onClick={() => this.handleRowClick(result.id)}
                          >
                            <StyledTableCell>{result.name}</StyledTableCell>
                            <StyledTableCell>{result.country ? result.country : '-'}</StyledTableCell>
                            <StyledTableCell>{result.massif.name ? result.massif.name : '-'}</StyledTableCell>
                            <StyledTableCell>{result.aestheticism ? Number(result.aestheticism.toFixed(1)) : '-'}</StyledTableCell>
                            <StyledTableCell>{result.caving ? Number(result.caving.toFixed(1)) : '-'}</StyledTableCell>
                            <StyledTableCell>{result.approach ? Number(result.approach.toFixed(1)) : '-'}</StyledTableCell>
                            <StyledTableCell>{result.cave.name ? result.cave.name : '-'}</StyledTableCell>
                            <StyledTableCell>{result.cave.length ? `${result.cave.length}m` : '-'}</StyledTableCell>
                            <StyledTableCell>{result.cave.depth ? `${result.cave.depth}m` : '-'}</StyledTableCell>
                          </StyledTableRow>
                        ))}

                    </TableBody>
                  </Table>
                  <StyledTablePagination
                    rowsPerPageOptions={[5, 10, 20]}
                    component="div"
                    count={totalNbResults}
                    rowsPerPage={rowsPerPage}
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
                        rowsPerPage={rowsPerPage}
                        onChangePage={this.handleChangePage}
                        count={totalNbResults}
                      />
                    )}
                  />
                </React.Fragment>
              ) : (
                <Translate>No results</Translate>
              )
            )}
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
  resourceType: PropTypes.oneOf(['', 'entries', 'groups', 'massifs']).isRequired,
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
