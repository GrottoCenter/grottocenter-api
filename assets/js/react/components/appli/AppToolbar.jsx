import React, {PropTypes} from 'react';
import {Toolbar, ToolbarGroup} from 'material-ui/Toolbar';
import HeaderTitle from './HeaderTitle';
import SideMenuBurgerConnector from '../../containers/SideMenuBurgerConnector';
//import Language from './Language';
//import Connected from './Connected';
//import Notifications from './Notifications';
import QuicksearchContainer from '../../containers/QuicksearchContainer';
import muiThemeable from 'material-ui/styles/muiThemeable';
import styled from 'styled-components';
import {sideMenuWidth} from '../../conf/Config';

const StyledToolbar = muiThemeable()(styled(Toolbar)`
  padding: 0px !important;
  background-color: ${props => props.muiTheme.palette.primary1Color} !important;
  height: 60px !important;
`);

const TitleGroup = muiThemeable()(styled(Toolbar)`
  width: ${sideMenuWidth} !important;
  padding: 0px !important;
  background-color: ${props => props.muiTheme.palette.primary2Color} !important;
  align-items: center;
  height: 60px !important;
`);

const StyledQuicksearchContainer = muiThemeable()(styled(QuicksearchContainer)`
  padding: 0px !important;
  padding-left: 30px !important;

  > label {
    font-weight: 400;
    font-size: 20px;
    top: 25px !important;
    color: ${props => props.muiTheme.palette.primary3Color} !important;
  }

  > hr {
    display: none;
  }
`);

const LargerToolbarGroup = styled(ToolbarGroup)`
  width: 400px !important;
`;

const AppToolbar = () => (
  <StyledToolbar>
    <TitleGroup>
      <HeaderTitle title='Grottocenter' subtitle='Achere - 2017'/>
      <SideMenuBurgerConnector/>
    </TitleGroup>

    <LargerToolbarGroup>
      <StyledQuicksearchContainer />
    </LargerToolbarGroup>

    <ToolbarGroup>

    </ToolbarGroup>
  </StyledToolbar>
);

AppToolbar.propTypes ={
  title: PropTypes.string,
  subtitle: PropTypes.string
}

export default AppToolbar;
