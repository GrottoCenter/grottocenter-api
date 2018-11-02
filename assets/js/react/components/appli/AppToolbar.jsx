import React from 'react';
import PropTypes from 'prop-types';
import Toolbar from '@material-ui/core/Toolbar';
import HeaderTitle from './HeaderTitle';
import SideMenuBurgerConnector from '../../containers/SideMenuBurgerConnector';
//import Language from './Language';
//import Connected from './Connected';
//import Notifications from './Notifications';
import QuicksearchContainer from '../../containers/QuicksearchContainer';
import { withTheme } from '@material-ui/core/styles';
import styled from 'styled-components';
import {sideMenuWidth} from '../../conf/Config';

const StyledToolbar = withTheme()(styled(Toolbar)`
  padding: 0px !important;
  background-color: ${props => props.theme.palette.primary1Color} !important;
  height: 60px !important;
`);

const TitleGroup = withTheme()(styled(Toolbar)`
  width: ${sideMenuWidth} !important;
  padding: 0px !important;
  background-color: ${props => props.theme.palette.primary2Color} !important;
  align-items: center;
  height: 60px !important;
`);

const StyledQuicksearchContainer = withTheme()(styled(QuicksearchContainer)`
  padding: 0px !important;
  padding-left: 30px !important;

  > label {
    font-weight: 400;
    font-size: 20px;
    top: 25px !important;
    color: ${props => props.theme.palette.primary3Color} !important;
  }

  > hr {
    display: none;
  }
`);

const LargerToolbarGroup = styled.div`
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

    <div>

    </div>
  </StyledToolbar>
);

AppToolbar.propTypes ={
  title: PropTypes.string,
  subtitle: PropTypes.string
}

export default AppToolbar;
