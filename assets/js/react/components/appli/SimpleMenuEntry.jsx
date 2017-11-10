import React, {PropTypes, Component} from 'react';
import MenuItem from 'material-ui/MenuItem';
import muiThemeable from 'material-ui/styles/muiThemeable';
import styled from 'styled-components';

const SecondLevelMenuItem = muiThemeable()(styled(MenuItem)`
  background-color: ${props => props.muiTheme.palette.primary3Color} !important;
  border-bottom: 1px dotted ${props => props.muiTheme.palette.primary1Color} !important;
  transition: transform 450ms cubic-bezier(0.23, 1, 0.32, 1) 0ms !important;
`);

class SimpleMenuEntry extends Component {
  constructor(props) {
    super(props);
    this.props.register(this.props.identifier, this.props.open);
  }

  render() {
    return (
      <SecondLevelMenuItem leftIcon={this.props.icon}>
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
  register: PropTypes.func.isRequired
};

export default SimpleMenuEntry;
