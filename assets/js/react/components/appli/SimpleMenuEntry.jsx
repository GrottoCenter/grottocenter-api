import React, { Component } from 'react';
import PropTypes from 'prop-types';
import MenuItem from '@material-ui/core/MenuItem';
import { withTheme } from '@material-ui/core/styles';
import styled from 'styled-components';
import browserHistory from 'react-router-dom/BrowserRouter';

//
//
// S T Y L I N G - C O M P O N E N T S
//
//

const SecondLevelMenuItem = withTheme()(styled(MenuItem)`
  background-color: ${props => props.theme.palette.primary3Color} !important;
  border-bottom: 1px dotted ${props => props.theme.palette.primary1Color} !important;
  transition: transform 2ms cubic-bezier(0.23, 1, 0.32, 1) 0ms !important;
  font-size: 14px !important;

  & > div > div {
    padding-left: 40px !important;

    & > svg {
      left: -2px !important;
      height: 20px !important;
      width: 20px !important;
    }
  }
`);

//
//
// M A I N - C O M P O N E N T
//
//

class SimpleMenuEntry extends Component {
  constructor(props) {
    super(props);
    this.props.register(this.props.identifier, this.props.open, this.props.target);
  }

  render() {
    const callOnClick = () => {
      browserHistory.push(this.props.target);
      this.props.toggleSideMenu();
    };

    return (
      <SecondLevelMenuItem leftIcon={this.props.icon} onClick={callOnClick}>
        {this.props.text}
      </SecondLevelMenuItem>
    );
  }
}

SimpleMenuEntry.propTypes = {
  identifier: PropTypes.string.isRequired,
  text: PropTypes.node.isRequired,
  icon: PropTypes.element,
  open: PropTypes.bool.isRequired,
  target: PropTypes.string.isRequired,
  register: PropTypes.func.isRequired,
  toggleSideMenu: PropTypes.func.isRequired,
};

export default SimpleMenuEntry;
