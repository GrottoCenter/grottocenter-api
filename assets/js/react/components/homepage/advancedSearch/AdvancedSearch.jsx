import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import styled from 'styled-components';
import EntriesSearch from './EntriesSearch';
import GroupsSearch from './GroupsSearch';
import MassifsSearch from './MassifsSearch';
import BbsSearch from './BbsSearch';
import Translate from '../../common/Translate';

import SearchResultsContainer from '../../../containers/SearchResultsContainer';

const advancedSearchTypes = ['entries', 'grottos', 'massifs', 'bbs'];

const styles = (theme) => ({
  root: {
    backgroundColor: theme.palette.primary.dark,
    flexGrow: 1,
    width: '100%',
  },
  tabName: {
    fontSize: '1.4rem',
    flexShrink: 0,
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
    tabSelected: 0,
  };

  handleChange = (event, value) => {
    this.setState({ tabSelected: value });
  };

  render() {
    const {
      classes,
      resetAdvancedSearch,
      startAdvancedsearch,
      getSubThemes,
      subthemes,
      themes,
    } = this.props;
    const { tabSelected } = this.state;

    return (
      <div className={classes.root}>
        <AppBar position="static" color="default">
          <Tabs
            variant="fullWidth"
            // scrollable
            // scrollButtons="off"
            value={tabSelected}
            onChange={this.handleChange}
            indicatorColor="primary"
            textColor="primary"
          >
            <Tab
              className={classes.tabName}
              label={
                <>
                  <TabIcon src="/images/entry.svg" alt="Entry icon" />
                  <Translate>Entries</Translate>
                </>
              }
            />
            <Tab
              className={classes.tabName}
              label={
                <React.Fragment>
                  <TabIcon src="/images/club.svg" alt="Group icon" />
                  <Translate>Groups</Translate>
                </React.Fragment>
              }
            />
            <Tab
              className={classes.tabName}
              label={
                <React.Fragment>
                  <TabIcon src="/images/massif.svg" alt="Massif icon" />
                  <Translate>Massifs</Translate>
                </React.Fragment>
              }
            />
            <Tab
              className={classes.tabName}
              label={
                <React.Fragment>
                  <TabIcon src="/images/bibliography.svg" alt="BBS icon" />
                  <Translate>BBS</Translate>
                </React.Fragment>
              }
            />
          </Tabs>
        </AppBar>

        <div className={classes.tabContainer}>
          {tabSelected === 0 && (
            <EntriesSearch
              startAdvancedsearch={(state, resourceType) => {
                startAdvancedsearch(state, resourceType);
              }}
              resourceType={advancedSearchTypes[0]}
              resetResults={resetAdvancedSearch}
            />
          )}
          {tabSelected === 1 && (
            <GroupsSearch
              startAdvancedsearch={(state, resourceType) => {
                startAdvancedsearch(state, resourceType);
              }}
              resourceType={advancedSearchTypes[1]}
              resetResults={resetAdvancedSearch}
            />
          )}
          {tabSelected === 2 && (
            <MassifsSearch
              startAdvancedsearch={(state, resourceType) => {
                startAdvancedsearch(state, resourceType);
              }}
              resourceType={advancedSearchTypes[2]}
              resetResults={resetAdvancedSearch}
            />
          )}
          {tabSelected === 3 && (
            <BbsSearch
              startAdvancedsearch={(state, resourceType) => {
                startAdvancedsearch(state, resourceType);
              }}
              resourceType={advancedSearchTypes[3]}
              resetResults={resetAdvancedSearch}
              getSubThemes={getSubThemes}
              subthemes={subthemes}
              themes={themes}
            />
          )}

          <SearchResultsContainer />
        </div>
      </div>
    );
  }
}

AdvancedSearch.propTypes = {
  classes: PropTypes.shape({}).isRequired,
  resetAdvancedSearch: PropTypes.func.isRequired,
  startAdvancedsearch: PropTypes.func.isRequired,
  getSubThemes: PropTypes.func.isRequired,
  subthemes: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  themes: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
};

AdvancedSearch.defaultProps = {};

export default withStyles(styles)(AdvancedSearch);
