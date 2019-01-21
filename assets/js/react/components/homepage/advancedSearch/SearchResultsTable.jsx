/* eslint-disable no-nested-ternary */
import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import { withRouter } from 'react-router-dom';

import { Card, CardContent } from '@material-ui/core';
import CircularProgress from '@material-ui/core/CircularProgress';


import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TablePagination from '@material-ui/core/TablePagination';
import TableRow from '@material-ui/core/TableRow';
import TableSortLabel from '@material-ui/core/TableSortLabel';

import Translate from '../../common/Translate';

// ===========================================

const StyledTablePagination = withStyles(() => ({
  root: {
    fontSize: '1.2rem',
  },
  caption: {
    fontSize: '1.2rem',
  },
}))(TablePagination);

const styles = theme => ({
  resultsContainer: {
    margin: '24px',
  },
  table: {
    marginBottom: 0,
  },
  tableCell: {
    fontSize: '1.2rem',
    textAlign: 'center',
  },
  tableHeadRowCell: {
    fontSize: '1.3rem',
    fontWeight: 'bold',
    color: '#eee',
    textAlign: 'center',
  },
  tableHeadRow: {
    backgroundColor: theme.palette.primary.light,
  },
  tableRow: {
    height: '3rem',
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
      cursor: 'pointer',
    },
  },
});

class SearchResultsTable extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      page: 0,
      rowsPerPage: 10,
    };
    this.entriesTableHead = this.entriesTableHead.bind(this);
    this.groupsTableHead = this.groupsTableHead.bind(this);
    this.massifsTableHead = this.massifsTableHead.bind(this);
    this.handleRowClick = this.handleRowClick.bind(this);
  }

  entriesTableHead = () => {
    const { classes } = this.props;
    return (
      <TableHead>
        <TableRow className={classes.tableHeadRow}>
          <TableCell className={classes.tableHeadRowCell}>
            <Translate>Name</Translate>
          </TableCell>
          <TableCell className={classes.tableHeadRowCell}>
            <Translate>Country</Translate>
          </TableCell>
          <TableCell className={classes.tableHeadRowCell}>
            <Translate>Massif name</Translate>
          </TableCell>
          <TableCell className={classes.tableHeadRowCell}>
            <Translate>Aesthetic</Translate>
          </TableCell>
          <TableCell className={classes.tableHeadRowCell}>
            <Translate>Ease of move</Translate>
          </TableCell>
          <TableCell className={classes.tableHeadRowCell}>
            <Translate>Ease of reach</Translate>
          </TableCell>
          <TableCell className={classes.tableHeadRowCell}>
            <Translate>Cave name</Translate>
          </TableCell>
          <TableCell className={classes.tableHeadRowCell}>
            <Translate>Cave length</Translate>
          </TableCell>
          <TableCell className={classes.tableHeadRowCell}>
            <Translate>Cave depth</Translate>
          </TableCell>
        </TableRow>
      </TableHead>
    );
  };

  groupsTableHead = () => {
    const { classes } = this.props;
    return (
      <TableHead>
        <TableRow className={classes.tableHeadRow}>
          <TableCell className={classes.tableCell}><Translate>Name</Translate></TableCell>
          <TableCell className={classes.tableCell}><Translate>Country</Translate></TableCell>
          <TableCell className={classes.tableCell}><Translate>Massif</Translate></TableCell>
          <TableCell className={classes.tableCell}><Translate>Aesthetic</Translate></TableCell>
          <TableCell className={classes.tableCell}><Translate>Ease of move</Translate></TableCell>
          <TableCell className={classes.tableCell}><Translate>Ease of reach</Translate></TableCell>
          <TableCell className={classes.tableCell}><Translate>Cave length</Translate></TableCell>
          <TableCell className={classes.tableCell}><Translate>Cave depth</Translate></TableCell>
        </TableRow>
      </TableHead>
    );
  };

  massifsTableHead = () => {
    const { classes } = this.props;
    return (
      <TableHead>
        <TableRow className={classes.tableHeadRow}>
          <TableCell className={classes.tableCell}><Translate>Name</Translate></TableCell>
          <TableCell className={classes.tableCell}><Translate>Country</Translate></TableCell>
          <TableCell className={classes.tableCell}><Translate>Massif</Translate></TableCell>
          <TableCell className={classes.tableCell}><Translate>Aesthetic</Translate></TableCell>
          <TableCell className={classes.tableCell}><Translate>Ease of move</Translate></TableCell>
          <TableCell className={classes.tableCell}><Translate>Ease of reach</Translate></TableCell>
          <TableCell className={classes.tableCell}><Translate>Cave length</Translate></TableCell>
          <TableCell className={classes.tableCell}><Translate>Cave depth</Translate></TableCell>
        </TableRow>
      </TableHead>
    );
  };

  // ===== Handle functions ===== //

  handleRowClick = (id) => {
    const { history, resourceType, resetAdvancedSearch } = this.props;
    resetAdvancedSearch();
    if (resourceType === 'entries') history.push(`/ui/entries/${id}`);
    if (resourceType === 'groups') history.push(`/ui/groups/${id}`);
    if (resourceType === 'massifs') history.push(`/ui/massifs/${id}`);
  }

  handleChangePage = (event, page) => {
    this.setState({ page });
  }

  handleChangeRowsPerPage = (event) => {
    this.setState({ rowsPerPage: event.target.value });
  }

  // ===== Render ===== //

  render() {
    const {
      classes, isLoading, results, resourceType,
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
                          <TableRow
                            key={result.id}
                            className={classes.tableRow}
                            onClick={() => this.handleRowClick(result.id)}
                          >
                            <TableCell className={classes.tableCell} component="th" scope="result">
                              {result.name}
                            </TableCell>
                            <TableCell className={classes.tableCell}>{result.country ? result.country : '-'}</TableCell>
                            <TableCell className={classes.tableCell}>{result.massif.name ? result.massif.name : '-'}</TableCell>
                            <TableCell className={classes.tableCell}>{result.aestheticism ? Number(result.aestheticism.toFixed(1)) : '-'}</TableCell>
                            <TableCell className={classes.tableCell}>{result.caving ? Number(result.caving.toFixed(1)) : '-'}</TableCell>
                            <TableCell className={classes.tableCell}>{result.approach ? Number(result.approach.toFixed(1)) : '-'}</TableCell>
                            <TableCell className={classes.tableCell}>{result.cave.name ? result.cave.name : '-'}</TableCell>
                            <TableCell className={classes.tableCell}>{result.cave.length ? `${result.cave.length}m` : '-'}</TableCell>
                            <TableCell className={classes.tableCell}>{result.cave.depth ? `${result.cave.depth}m` : '-'}</TableCell>
                          </TableRow>
                        ))}

                    </TableBody>
                  </Table>
                  <StyledTablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={results.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    backIconButtonProps={{
                      'aria-label': 'Previous Page',
                    }}
                    nextIconButtonProps={{
                      'aria-label': 'Next Page',
                    }}
                    labelRowsPerPage={<Translate>Results per page</Translate>}
                    onChangePage={(event, page) => this.handleChangePage(event, page)}
                    onChangeRowsPerPage={event => this.handleChangeRowsPerPage(event)}
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
};

SearchResultsTable.defaultProps = {
  results: undefined,
};

export default withRouter(withStyles(styles)(SearchResultsTable));
