/* eslint-disable no-nested-ternary */
import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';

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

const styles = theme => ({
  resultsContainer: {
    margin: '24px',
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
  },
});

class SearchResultsTable extends React.Component {
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
            <Translate>Massif</Translate>
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

  render() {
    const {
      classes, isLoading, results, resultsType,
    } = this.props;

    let ResultsTableHead;
    if (resultsType === 'entries') ResultsTableHead = this.entriesTableHead;
    if (resultsType === 'groups') ResultsTableHead = this.groupsTableHead;
    if (resultsType === 'massifs') ResultsTableHead = this.massifsTableHead;

    return (
      (results !== undefined ? (
        <Card className={classes.resultsContainer}>
          <CardContent>
            {isLoading ? (
              <CircularProgress />
            ) : (
              results.length > 0 ? (
                <Table>
                  <ResultsTableHead />
                  <TableBody>

                    {results.map(result => (
                      <TableRow key={result.id} className={classes.tableRow}>
                        <TableCell className={classes.tableCell} component="th" scope="result">
                          {result.name}
                        </TableCell>
                        <TableCell className={classes.tableCell}>{result.country}</TableCell>
                        <TableCell className={classes.tableCell}>{result.massif.name}</TableCell>
                        <TableCell className={classes.tableCell}>{result.aestheticism}</TableCell>
                        <TableCell className={classes.tableCell}>{result.caving}</TableCell>
                        <TableCell className={classes.tableCell}>{result.approach}</TableCell>
                        <TableCell className={classes.tableCell}>{result.cave.name}</TableCell>
                        <TableCell className={classes.tableCell}>{result.cave.length}</TableCell>
                        <TableCell className={classes.tableCell}>{result.cave.depth}</TableCell>
                      </TableRow>
                    ))}

                  </TableBody>
                </Table>
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
  isLoading: PropTypes.bool.isRequired,
  results: PropTypes.arrayOf(PropTypes.shape({})),
  resultsType: PropTypes.oneOf(['entries', 'groups', 'massifs']).isRequired,
};

SearchResultsTable.defaultProps = {
  results: undefined,
};

export default withStyles(styles)(SearchResultsTable);
