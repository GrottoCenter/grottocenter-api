import React from 'react';
import Toolbar from '@material-ui/core/Toolbar';
import { withStyles } from '@material-ui/core/styles';
import HeaderTitle from './HeaderTitle';
import SideMenuBurgerConnector from '../../containers/SideMenuBurgerConnector';
import { sideMenuWidth } from '../../conf/Config';

//
//
// S T Y L I N G - C O M P O N E N T S
//
//

const StyledToolbar = withStyles((theme) => ({
  root: {
    width: '100%',
    padding: '0px',
    backgroundColor: theme.palette.primary2Color,
    height: '60px',
    display: 'inline-flex',
    justifyContent: 'space-between',
  },
}), { withTheme: true })(Toolbar);

const TitleGroup = withStyles(() => ({
  root: {
    width: sideMenuWidth,
    padding: '0px',
    alignItems: 'center',
    height: '60px',
  },
}), { withTheme: true })(Toolbar);

//
//
// M A I N - C O M P O N E N T
//
//

const AppToolbar = () => (
  <StyledToolbar>
    <TitleGroup>
      <HeaderTitle title="Grottocenter" subtitle="Achere - 2018" />
      <SideMenuBurgerConnector />
    </TitleGroup>
  </StyledToolbar>
);

export default AppToolbar;
