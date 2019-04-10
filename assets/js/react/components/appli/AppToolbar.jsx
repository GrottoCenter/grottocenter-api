import React from 'react';
import PropTypes from 'prop-types';
import Toolbar from '@material-ui/core/Toolbar';
import { withStyles, withTheme } from '@material-ui/core/styles';
import styled from 'styled-components';
import HeaderTitle from './HeaderTitle';
import SideMenuBurgerConnector from '../../containers/SideMenuBurgerConnector';
import QuicksearchContainer from '../../containers/QuicksearchContainer';
import { sideMenuWidth } from '../../conf/Config';

//
//
// S T Y L I N G - C O M P O N E N T S
//
//

const StyledToolbar = withStyles(theme => ({
  root: {
    width: '100%',
    padding: '0px',
    backgroundColor: theme.palette.primary2Color,
    height: '60px',
    display: 'inline-flex',
    justifyContent: 'space-between',
  },
}), { withTheme: true })(Toolbar);

const TitleGroup = withStyles(theme => ({
  root: {
    width: sideMenuWidth,
    padding: '0px',
    alignItems: 'center',
    height: '60px',
  },
}), { withTheme: true })(Toolbar);

const StyledQuicksearchContainer = withStyles(theme => ({
  root: {
    flex: 10,
  },
  input: {
    backgroundColor: theme.palette.primary3Color,
  },
  valueContainer: {
    height: '64px',
  },
}), { withTheme: true })(QuicksearchContainer);

const LargerToolbarGroup = styled.div`
  width: 400px;
`;

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

    <LargerToolbarGroup>
      <StyledQuicksearchContainer />
    </LargerToolbarGroup>

    <div />
  </StyledToolbar>
);

AppToolbar.propTypes = {
  title: PropTypes.string,
  subtitle: PropTypes.string,
};

export default AppToolbar;
