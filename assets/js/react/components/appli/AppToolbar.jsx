import React, {PropTypes} from 'react';
import {Toolbar, ToolbarGroup} from 'material-ui/Toolbar';
import HeaderTitle from './HeaderTitle';
import MenuBurgerConnector from '../../containers/MenuBurgerConnector';
import Language from './Language';
import Connected from './Connected';
import Notifications from './Notifications';
import QuicksearchContainer from '../../containers/QuicksearchContainer';
import muiThemeable from 'material-ui/styles/muiThemeable';
import styled from 'styled-components';

const StyledToolbar = muiThemeable()(styled(Toolbar)`
  padding: 0px !important;
  background-color: ${props => props.muiTheme.palette.primary1Color} !important;
  height: 60px !important;
`);

const TitleGroup = muiThemeable()(styled(Toolbar)`
  width: 200px !important;
  padding: 0px !important;
  background-color: ${props => props.muiTheme.palette.primary2Color} !important;
  align-items: center;
  height: 60px !important;
`);

const AppToolbar = () => (
  <StyledToolbar>
    <TitleGroup>
      <HeaderTitle title='Grottocenter' subtitle='Achere - 2017'/>
      <MenuBurgerConnector/>
    </TitleGroup>

    <ToolbarGroup>
      <QuicksearchContainer/>
    </ToolbarGroup>

    <ToolbarGroup>
      <Notifications/>
      <Language/>
      <Connected/>
    </ToolbarGroup>
  </StyledToolbar>
);

AppToolbar.propTypes ={
  title: PropTypes.string,
  subtitle: PropTypes.string
}

export default AppToolbar;
