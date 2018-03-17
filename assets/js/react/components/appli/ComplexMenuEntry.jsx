import React, {PropTypes, Component} from 'react';
import MenuItem from 'material-ui/MenuItem';
import ExpandMoreIcon from 'material-ui/svg-icons/navigation/expand-more';
import ExpandLessIcon from 'material-ui/svg-icons/navigation/expand-less';
import muiThemeable from 'material-ui/styles/muiThemeable';
import styled from 'styled-components';

const FirstLevelMenuItem = muiThemeable()(styled(MenuItem)`
  background-color: ${props => props.muiTheme.palette.primary1Color} !important;
  color: ${props => props.muiTheme.palette.primary3Color} !important;
  transition: all 2s cubic-bezier(0.23, 1, 0.32, 1) 0ms !important;

  & > div > div {
    padding-left: 40px !important;

    & > svg {
      fill: ${props => props.muiTheme.palette.primary3Color} !important;
      left: -4px !important;
    }
  }
`);

class ComplexMenuEntry extends Component {
  constructor(props) {
    super(props);
    this.props.register(this.props.identifier, this.props.open);
  }

  render() {
    let display = (this.props.open)
      ? 'inherit'
      : 'none';

    let icon = (this.props.open)
      ? <ExpandLessIcon/>
      : <ExpandMoreIcon/>;

    if (!this.props.children) {
      icon = this.props.icon;
    }

    return (<div>
      <FirstLevelMenuItem onClick={() => this.props.toggle(this.props.identifier)} leftIcon={icon}>
        {this.props.text}
      </FirstLevelMenuItem>
      <div style={{
          display: display
        }}>{this.props.children}</div>
    </div>);
  }
}

ComplexMenuEntry.propTypes = {
  identifier: PropTypes.string.isRequired,
  text: PropTypes.node.isRequired,
  open: PropTypes.bool.isRequired,
  icon: PropTypes.node,
  children: PropTypes.node,
  register: PropTypes.func.isRequired,
  toggle: PropTypes.func.isRequired
};

export default ComplexMenuEntry;
