/* eslint-disable no-nested-ternary */
import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import styled from 'styled-components';
import { Card, CardContent } from '@material-ui/core';
import CircularProgress from '@material-ui/core/CircularProgress';
import EntriesSearch from './EntriesSearch';
import Translate from '../../common/Translate';

import { entityOptionForSelector } from '../../../helpers/Entity';

const advancedSearchTypes = ['entries', 'grottos', 'massifs'];

const styles = theme => ({
  root: {
    backgroundColor: theme.palette.primary.dark,
    flexGrow: 1,
    width: '100%',
  },
  resultsContainer: {
    margin: '24px',
  },
  tabName: {
    fontSize: '1.4rem',
  },
  tabContainer: {
    backgroundColor: theme.palette.primary3Color,
    padding: '24px',
  },
});

const TabIcon = styled.img`
  height: 2rem;
  margin-right: 5px;
  vertical-align: middle;
  width: 2rem;
`;

class AdvancedSearch extends React.Component {
  state = {
    value: 0,
  };

  handleChange = (event, value) => {
    this.setState({ value });
  };

  render() {
    const {
      classes, isLoading, results, resetAdvancedSearch, startAdvancedsearch,
    } = this.props;
    const { value } = this.state;

    return (
      <div className={classes.root}>
        <AppBar position="static" color="default">
          <Tabs
            value={value}
            onChange={this.handleChange}
            indicatorColor="primary"
            textColor="primary"
            centered
          >
            <Tab
              className={classes.tabName}
              label={(
                <React.Fragment>
                  <TabIcon src="/images/entry.svg" alt="Entry icon" />
                  <Translate>Entries</Translate>
                </React.Fragment>
              )}
            />
            <Tab
              className={classes.tabName}
              label={(
                <React.Fragment>
                  <TabIcon src="/images/club.svg" alt="Group icon" />
                  <Translate>Groups</Translate>
                </React.Fragment>
              )}
            />
            <Tab
              className={classes.tabName}
              label={(
                <React.Fragment>
                  <TabIcon src="/images/entry-cluster.svg" alt="Massif icon" />
                  <Translate>Massifs</Translate>
                </React.Fragment>
              )}
            />
          </Tabs>
        </AppBar>

        {results ? (
          <Card className={classes.resultsContainer}>
            <CardContent>
              {isLoading ? (
                <CircularProgress />
              ) : (
                results.length > 0 ? (
                  results.map(result => (
                    <div>
                      {entityOptionForSelector({
                        ...result,
                        label: result.name,
                      })}
                    </div>
                  ))
                ) : (
                  <Translate>Aucun résultat</Translate>
                )
              )}
            </CardContent>
          </Card>
        ) : (
          ''
        )}

        {value === 0 && (
          <div className={classes.tabContainer}>
            <EntriesSearch
              startAdvancedsearch={startAdvancedsearch}
              resourceType={advancedSearchTypes[0]}
              resetResults={resetAdvancedSearch}
            />
          </div>
        )}
        {value === 1 && <div className={classes.tabContainer}>Groups search content</div>}
        {value === 2 && <div className={classes.tabContainer}>Massifs search content</div>}
      </div>
    );
  }
}

AdvancedSearch.propTypes = {
  classes: PropTypes.shape({}).isRequired,
  isLoading: PropTypes.bool.isRequired,
  results: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  resetAdvancedSearch: PropTypes.func.isRequired,
  startAdvancedsearch: PropTypes.func.isRequired,
};

export default withStyles(styles)(AdvancedSearch);
