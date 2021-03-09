import React, { Component } from 'react';
import PropTypes from 'prop-types';
import CircularProgress from '@material-ui/core/CircularProgress';
import SyncKOIcon from '@material-ui/icons/SyncProblem';
import IconButton from '@material-ui/core/IconButton';
import { withStyles } from '@material-ui/core/styles';
import { loadDynamicNumber } from '../../actions/DynamicNumber';
import { DYNAMIC_NUMBER_RELOAD_INTERVAL } from '../../conf/Config';

//
//
// S T Y L I N G - C O M P O N E N T S
//
//

const StyledIconButton = withStyles(
  (theme) => ({
    root: {
      fill: theme.palette.accent1Color,
    },
  }),
  { withTheme: true },
)(IconButton);

const StyledSyncKOIcon = withStyles(
  (theme) => ({
    root: {
      '&:hover': {
        fill: theme.palette.accent1Color,
      },
      fill: theme.palette.primary3Color,
      height: '48px',
      width: '48px',
    },
  }),
  { withTheme: true },
)(SyncKOIcon);

//
//
// M A I N - C O M P O N E N T
//
//

class DynamicNumber extends Component {
  constructor(props) {
    super(props);
    this.reloadNumber = this.reloadNumber.bind(this);
    this.reloadNumber()();
  }

  reloadNumber() {
    return () => this.props.dispatch(loadDynamicNumber(this.props.numberType));
  }

  componentDidMount() {
    this.interval = setInterval(
      this.reloadNumber(),
      DYNAMIC_NUMBER_RELOAD_INTERVAL,
    );
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  render() {
    if (this.props.isFetching) {
      return <CircularProgress />;
    }
    if (!this.props.number) {
      return (
        <StyledIconButton tooltip="Synchronisation error">
          <StyledSyncKOIcon />
        </StyledIconButton>
      );
    }
    return <span className={this.props.className}>{this.props.number}</span>;
  }
}

DynamicNumber.propTypes = {
  isFetching: PropTypes.bool,
  number: PropTypes.number,
  numberType: PropTypes.string,
  className: PropTypes.string,
  dispatch: PropTypes.any.isRequired,
};

export default DynamicNumber;
