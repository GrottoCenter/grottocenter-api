import React, { Component } from 'react';
import PropTypes from 'prop-types';
import MenuItem from '@material-ui/core/MenuItem';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import { withTheme } from '@material-ui/core/styles';
import styled from 'styled-components';
import { BrowserRouter } from 'react-router-dom';

//
//
// S T Y L I N G - C O M P O N E N T S
//
//

const FirstLevelMenuItem = withTheme(styled(MenuItem)`
  background-color: ${(props) => props.theme.palette.primary1Color} !important;
  color: ${(props) => props.theme.palette.primary3Color} !important;
  transition: all 2s cubic-bezier(0.23, 1, 0.32, 1) 0ms !important;

  & > div > div {
    padding-left: 40px !important;

    & > svg {
      fill: ${(props) => props.theme.palette.primary3Color} !important;
      left: -4px !important;
    }
  }
`);

//
//
// M A I N - C O M P O N E N T
//
//
class ComplexMenuEntry extends Component {
  constructor(props) {
    super(props);
    const { identifier, open, target, register } = props;
    register(identifier, open, target);
  }

  render() {
    const {
      open,
      children,
      icon,
      toggle,
      identifier,
      target,
      toggleSideMenu,
      text,
    } = this.props;
    const display = open ? 'inherit' : 'none';

    let leftIcon;
    if (children) {
      leftIcon = icon;
    } else {
      leftIcon = open ? <ExpandLessIcon /> : <ExpandMoreIcon />;
    }

    let callOnClick = () => toggle(identifier);
    if (target) {
      callOnClick = () => {
        BrowserRouter.push(target);
        toggleSideMenu();
      };
    }

    return (
      <div>
        <FirstLevelMenuItem onClick={callOnClick} leftIcon={leftIcon}>
          {text}
        </FirstLevelMenuItem>
        <div
          style={{
            display,
          }}
        >
          {children}
        </div>
      </div>
    );
  }
}

ComplexMenuEntry.propTypes = {
  identifier: PropTypes.string.isRequired,
  text: PropTypes.node.isRequired,
  open: PropTypes.bool.isRequired,
  icon: PropTypes.node,
  children: PropTypes.node,
  register: PropTypes.func.isRequired,
  toggle: PropTypes.func.isRequired,
  target: PropTypes.string,
  toggleSideMenu: PropTypes.func.isRequired,
};

export default ComplexMenuEntry;
