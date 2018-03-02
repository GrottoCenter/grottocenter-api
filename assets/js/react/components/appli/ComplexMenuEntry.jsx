import React, {PropTypes, Component} from 'react';
import MenuItem from 'material-ui/MenuItem';
import ArrowUpIcon from 'material-ui/svg-icons/navigation/arrow-drop-up';
import ArrowDownIcon from 'material-ui/svg-icons/navigation/arrow-drop-down';
import muiThemeable from 'material-ui/styles/muiThemeable';
import styled from 'styled-components';

const FirstLevelMenuItem = muiThemeable()(styled(MenuItem)`
  background-color: ${props => props.muiTheme.palette.primary1Color} !important;
`);

class ComplexMenuEntry extends Component {
  constructor(props) {
    super(props);
    this.props.register(this.props.identifier, this.props.open);
  }

  render() {
    let display = (this.props.open) ? 'inherit' : 'none';
    let icon = (this.props.open) ? <ArrowDownIcon/> : <ArrowUpIcon/>;
    return (
      <div>
        <FirstLevelMenuItem onClick={() => this.props.toggle(this.props.identifier)} leftIcon={this.props.icon} rightIcon={icon}>
          {this.props.text}
        </FirstLevelMenuItem>
        <div style={{display: display}}>{this.props.children}</div>
      </div>
    );
  }
}

ComplexMenuEntry.propTypes = {
  identifier: PropTypes.string.isRequired,
  text: PropTypes.node.isRequired,
  icon: PropTypes.element,
  open: PropTypes.bool.isRequired,
  children: PropTypes.node,
  register: PropTypes.func.isRequired,
  toggle: PropTypes.func.isRequired
};

export default ComplexMenuEntry;
