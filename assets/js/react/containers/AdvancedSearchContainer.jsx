import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Typography from '@material-ui/core/Typography';
import EntriesSearch from '../components/homepage/EntriesSearch';

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
    flexGrow: 1,
    width: '100%',
    backgroundColor: theme.palette.background.paper,
  },
});

class AdvancedSearchContainer extends React.Component {
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
            <Tab label="Entries" />
            <Tab label="Groups" />
            <Tab label="Massifs" />
          </Tabs>
        </AppBar>
        {value === 0 && <TabContainer><EntriesSearch /></TabContainer>}
        {value === 1 && <TabContainer>Test2</TabContainer> }
        {value === 2 && <TabContainer>Massifs</TabContainer>}
      </div>
    );
  }
}

AdvancedSearchContainer.propTypes = {
  classes: PropTypes.shape({}).isRequired,
};

export default withStyles(styles)(AdvancedSearchContainer);
