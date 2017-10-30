import React, {PropTypes} from 'react';
import Drawer from 'material-ui/Drawer';
import MenuItem from 'material-ui/MenuItem';
import ArrowIcon from 'material-ui/svg-icons/navigation/arrow-drop-down';
import muiThemeable from 'material-ui/styles/muiThemeable';
import styled from 'styled-components';

const Menubar = muiThemeable()(styled(Drawer)`
  > div {
    width: 200px !important;
    top: 60px !important;
    background-color: ${props => props.muiTheme.palette.primary1Color} !important;
  }
`);

const SideMenu = (props) => (
  <Menubar open={props.visible}>
    <MenuItem
      rightIcon={<ArrowIcon/>}
      menuItems={<MenuItem>Menu Item 3</MenuItem>}
    >Cavités</MenuItem>
    <MenuItem>Réseaux</MenuItem>
    <MenuItem>Organisations</MenuItem>
    <MenuItem>Administration</MenuItem>
    <MenuItem>Exports</MenuItem>
  </Menubar>
);

SideMenu.propTypes = {
  visible: PropTypes.bool.isRequired
};

export default SideMenu;
