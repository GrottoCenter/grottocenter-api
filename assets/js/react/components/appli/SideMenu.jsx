import React from 'react';
import PropTypes from 'prop-types';
import Drawer from '@material-ui/core/Drawer';
import ArrowDownIcon from '@material-ui/icons/Navigation';
import AddIcon from '@material-ui/icons/Add';
import SearchIcon from '@material-ui/icons/Search';
import NetworkIcon from '@material-ui/icons/Timelapse';
import AdminIcon from '@material-ui/icons/SupervisorAccount';
import ExportIcon from '@material-ui/icons/ImportExport';
import { withTheme } from '@material-ui/core/styles';
import styled from 'styled-components';
import Translate from '../common/Translate';
import SimpleMenuEntryConnector from '../../containers/SimpleMenuEntryConnector';
import ComplexMenuEntryConnector from '../../containers/ComplexMenuEntryConnector';
import { sideMenuWidth } from '../../conf/Config';
import checkPermission from '../../helpers/Permissions';
import { VIEW_SIDEMENU } from '../../conf/Rights';

//
//
// S T Y L I N G - C O M P O N E N T S
//
//

const Menubar = withTheme()(styled(Drawer)`
  > div {
    width: ${sideMenuWidth} !important;
    top: 60px !important;
    background-color: ${props => props.theme.palette.primary1Color} !important;
  }
`);

//
//
// M A I N - C O M P O N E N T
//
//

const SideMenu = props => (
  <Menubar open={props.visible}>
    <ComplexMenuEntryConnector identifier="entry1" open={false} icon={<ArrowDownIcon />} text={<Translate>Entries</Translate>}>
      <SimpleMenuEntryConnector identifier="entrysub1" open={false} icon={<SearchIcon />} text={<Translate>Search</Translate>} target="/ui/entries/search" />
      <SimpleMenuEntryConnector identifier="entrysub2" open={false} icon={<AddIcon />} text={<Translate>Add</Translate>} target="/ui/entries/add" />
    </ComplexMenuEntryConnector>
    <ComplexMenuEntryConnector identifier="cave1" open={false} icon={<ArrowDownIcon />} text={<Translate>Caves</Translate>}>
      <SimpleMenuEntryConnector identifier="cavesub1" open={false} icon={<SearchIcon />} text={<Translate>Search</Translate>} target="/ui/caves/search" />
      <SimpleMenuEntryConnector identifier="cavesub2" open={false} icon={<AddIcon />} text={<Translate>Add</Translate>} target="/ui/caves/add" />
    </ComplexMenuEntryConnector>
    <ComplexMenuEntryConnector identifier="orga1" open={false} icon={<NetworkIcon />} text={<Translate>Organizations</Translate>} target="/ui/orga/" />
    <ComplexMenuEntryConnector identifier="admin1" open={false} icon={<AdminIcon />} text={<Translate>Administration</Translate>} target="/ui/admin/" />
    <ComplexMenuEntryConnector identifier="export1" open={false} icon={<ExportIcon />} text={<Translate>Exports</Translate>} target="/ui/orga/export/" />
  </Menubar>
);

SideMenu.propTypes = {
  visible: PropTypes.bool.isRequired,
};

export default checkPermission(VIEW_SIDEMENU)(SideMenu);
