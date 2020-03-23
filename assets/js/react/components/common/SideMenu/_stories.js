import React from 'react';
import styled from 'styled-components';
import { storiesOf } from '@storybook/react';
// import { action } from '@storybook/addon-actions';
import { isMobileOnly } from 'react-device-detect';

import { AppBar, Toolbar, Typography, IconButton } from '@material-ui/core';
import MenuIcon from '@material-ui/icons/Menu';

import SideMenu from './index';

const MainWrapper = styled.main`
  flex-grow: 1;
  padding: ${({ theme }) => theme.spacing(3)}px;
  transition: ${({ theme, isSideMenuOpen }) =>
    !isMobileOnly &&
    theme.transitions.create('margin', {
      easing: isSideMenuOpen ? theme.transitions.easing.easeOut : theme.transitions.easing.sharp,
      duration: isSideMenuOpen
        ? theme.transitions.duration.enteringScreen
        : theme.transitions.duration.leavingScreen,
    })};
  margin-left: ${({ theme, isSideMenuOpen }) =>
    !isMobileOnly && (isSideMenuOpen ? theme.sideMenuWidth : 0)}px;
`;

const WithState = () => {
  const [isSideMenuOpen, setToggleSideMenu] = React.useState(false);

  const toggleSideMenu = () => {
    setToggleSideMenu(!isSideMenuOpen);
  };

  return (
    <>
      <AppBar position="fixed">
        <Toolbar>
          <IconButton color="inherit" aria-label="open drawer" edge="end" onClick={toggleSideMenu}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap>
            Side Menu
          </Typography>
        </Toolbar>
      </AppBar>
      <SideMenu isOpen={isSideMenuOpen} toggle={toggleSideMenu} />
      <MainWrapper isSideMenuOpen={isSideMenuOpen}>
        <Typography paragraph>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt
          ut labore et dolore magna aliqua. Rhoncus dolor purus non enim praesent elementum
          facilisis leo vel. Risus at ultrices mi tempus imperdiet. Semper risus in hendrerit
          gravida rutrum quisque non tellus. Convallis convallis tellus id interdum velit laoreet id
          donec ultrices. Odio morbi quis commodo odio aenean sed adipiscing. Amet nisl suscipit
          adipiscing bibendum est ultricies integer quis. Cursus euismod quis viverra nibh cras.
          Metus vulputate eu scelerisque felis imperdiet proin fermentum leo. Mauris commodo quis
          imperdiet massa tincidunt. Cras tincidunt lobortis feugiat vivamus at augue. At augue eget
          arcu dictum varius duis at consectetur lorem. Velit sed ullamcorper morbi tincidunt. Lorem
          donec massa sapien faucibus et molestie ac.
        </Typography>
        <Typography paragraph>
          Consequat mauris nunc congue nisi vitae suscipit. Fringilla est ullamcorper eget nulla
          facilisi etiam dignissim diam. Pulvinar elementum integer enim neque volutpat ac
          tincidunt. Ornare suspendisse sed nisi lacus sed viverra tellus. Purus sit amet volutpat
          consequat mauris. Elementum eu facilisis sed odio morbi. Euismod lacinia at quis risus sed
          vulputate odio. Morbi tincidunt ornare massa eget egestas purus viverra accumsan in. In
          hendrerit gravida rutrum quisque non tellus orci ac. Pellentesque nec nam aliquam sem et
          tortor. Habitant morbi tristique senectus et. Adipiscing elit duis tristique sollicitudin
          nibh sit. Ornare aenean euismod elementum nisi quis eleifend. Commodo viverra maecenas
          accumsan lacus vel facilisis. Nulla posuere sollicitudin aliquam ultrices sagittis orci a.
        </Typography>
      </MainWrapper>
    </>
  );
};

storiesOf('SideMenu', module).add('Default', () => <WithState />);
