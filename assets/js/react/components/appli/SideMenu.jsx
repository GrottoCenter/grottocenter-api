import React, {PropTypes} from 'react';
import Drawer from 'material-ui/Drawer';
import ArrowDownIcon from 'material-ui/svg-icons/navigation/arrow-drop-down';
import AddIcon from 'material-ui/svg-icons/content/add-circle-outline';
import SearchIcon from 'material-ui/svg-icons/action/search';
import NetworkIcon from 'material-ui/svg-icons/action/timeline';
import AdminIcon from 'material-ui/svg-icons/action/supervisor-account';
import ExportIcon from 'material-ui/svg-icons/content/archive';
import Translate from '../common/Translate';
import SimpleMenuEntryConnector from '../../containers/SimpleMenuEntryConnector';
import ComplexMenuEntryConnector from '../../containers/ComplexMenuEntryConnector';
import muiThemeable from 'material-ui/styles/muiThemeable';
import styled from 'styled-components';
import {sideMenuWidth} from '../../conf/Config';
import checkPermission from '../common/CheckPermission';
import {VIEW_SIDEMENU} from '../../conf/Rights';


const Menubar = muiThemeable()(styled(Drawer)`
  > div {
    width: ${sideMenuWidth} !important;
    top: 60px !important;
    background-color: ${props => props.muiTheme.palette.primary1Color} !important;
  }
`);

const SideMenu = (props) => (
  <Menubar open={props.visible}>
    <ComplexMenuEntryConnector identifier='entry1' open={false} icon={<ArrowDownIcon/>} text={<Translate>Entries</Translate>}>
      <SimpleMenuEntryConnector identifier='entrysub1' open={false} icon={<SearchIcon/>} text={<Translate>Search</Translate>} target='/ui/entries/search'/>
      <SimpleMenuEntryConnector identifier='entrysub2' open={false} icon={<AddIcon/>} text={<Translate>Add</Translate>} target='/ui/entries/add'/>
    </ComplexMenuEntryConnector>
    <ComplexMenuEntryConnector identifier='cave1' open={false} icon={<ArrowDownIcon/>} text={<Translate>Caves</Translate>}>
      <SimpleMenuEntryConnector identifier='cavesub1' open={false} icon={<SearchIcon/>} text={<Translate>Search</Translate>} target='/ui/cave/search'/>
      <SimpleMenuEntryConnector identifier='cavesub2' open={false} icon={<AddIcon/>} text={<Translate>Add</Translate>} target='/ui/cave/add'/>
    </ComplexMenuEntryConnector>
    <ComplexMenuEntryConnector identifier='orga1' open={false} icon={<NetworkIcon/>} text={<Translate>Organizations</Translate>} target='/ui/orga/'/>
    <ComplexMenuEntryConnector identifier='admin1' open={false} icon={<AdminIcon/>} text={<Translate>Administration</Translate>} target='/ui/admin/'/>
    <ComplexMenuEntryConnector identifier='export1' open={false} icon={<ExportIcon/>} text={<Translate>Exports</Translate>} target='/ui/orga/export/'/>
  </Menubar>
);

SideMenu.propTypes = {
  visible: PropTypes.bool.isRequired
};

export default checkPermission(VIEW_SIDEMENU)(SideMenu);
