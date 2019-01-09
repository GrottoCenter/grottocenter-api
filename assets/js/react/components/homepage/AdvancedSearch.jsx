import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Typography from '@material-ui/core/Typography';
import styled from 'styled-components';

import EntriesSearch from './EntriesSearch';
import Translate from '../common/Translate';

function TabContainer(props) {
  const { children } = props;

  return (
    <Typography component="div" style={{ padding: 8 * 3 }}>
      {children}
    </Typography>
  );
}

TabContainer.propTypes = {
  children: PropTypes.node.isRequired,
};

const styles = theme => ({
  root: {
    backgroundColor: theme.palette.background.paper,
    flexGrow: 1,
    width: '100%',
  },
  tabName: {
    fontSize: '1.2rem',
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
    const { classes } = this.props;
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
        {value === 0 && <TabContainer><EntriesSearch /></TabContainer>}
        {value === 1 && <TabContainer>Groups search content</TabContainer> }
        {value === 2 && <TabContainer>Massifs search content</TabContainer>}
      </div>
    );
  }
}

AdvancedSearch.propTypes = {
  classes: PropTypes.shape({}).isRequired,
};

export default withStyles(styles)(AdvancedSearch);
