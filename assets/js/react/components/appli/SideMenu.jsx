import React, {PropTypes} from 'react';
import Drawer from 'material-ui/Drawer';
import MenuItem from 'material-ui/MenuItem';
import ArrowUpIcon from 'material-ui/svg-icons/navigation/arrow-drop-up';
import ArrowDownIcon from 'material-ui/svg-icons/navigation/arrow-drop-down';
import AddIcon from 'material-ui/svg-icons/content/add-circle-outline';
import SearchIcon from 'material-ui/svg-icons/action/search';
import muiThemeable from 'material-ui/styles/muiThemeable';
import styled from 'styled-components';

const Menubar = muiThemeable()(styled(Drawer)`
  > div {
    width: 200px !important;
    top: 60px !important;
    background-color: ${props => props.muiTheme.palette.primary1Color} !important;
  }
`);

const FirstLevelMenuItem = muiThemeable()(styled(MenuItem)`
  background-color: ${props => props.muiTheme.palette.primary1Color} !important;
`);

const SecondLevelMenuItem = muiThemeable()(styled(MenuItem)`
  background-color: ${props => props.muiTheme.palette.primary3Color} !important;
  border-bottom: 1px dotted ${props => props.muiTheme.palette.primary1Color} !important;
`);

const SideMenu = (props) => (
  <Menubar open={props.visible}>
    <FirstLevelMenuItem rightIcon={<ArrowDownIcon/>}>Cavités</FirstLevelMenuItem>
    <SecondLevelMenuItem leftIcon={<SearchIcon/>}>Rechercher</SecondLevelMenuItem>
    <SecondLevelMenuItem leftIcon={<AddIcon/>}>Ajouter</SecondLevelMenuItem>
    <FirstLevelMenuItem rightIcon={<ArrowUpIcon/>}>Réseaux</FirstLevelMenuItem>
    <FirstLevelMenuItem rightIcon={<ArrowUpIcon/>}>Organisations</FirstLevelMenuItem>
    <FirstLevelMenuItem rightIcon={<ArrowUpIcon/>}>Administration</FirstLevelMenuItem>
    <FirstLevelMenuItem rightIcon={<ArrowUpIcon/>}>Exports</FirstLevelMenuItem>
  </Menubar>
);

SideMenu.propTypes = {
  visible: PropTypes.bool.isRequired
};

export default SideMenu;
