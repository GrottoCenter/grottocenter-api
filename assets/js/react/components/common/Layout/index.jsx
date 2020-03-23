import React from 'react';
import { isMobileOnly } from 'react-device-detect';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import ErrorBoundary from 'react-error-boundary';
import AppBar from '../AppBar';
import SideMenu from '../SideMenu';

const MainWrapper = styled.main`
  flex-grow: 1;
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

const Layout = ({ children, isAuth = false, isSideMenuOpen, toggleSideMenu }) => (
  <>
    <AppBar toggleMenu={toggleSideMenu} isAuth={isAuth} />
    <SideMenu isOpen={isSideMenuOpen} toggle={toggleSideMenu} />
    <MainWrapper isSideMenuOpen={isSideMenuOpen}>
      <ErrorBoundary>{children}</ErrorBoundary>
    </MainWrapper>
  </>
);

Layout.propTypes = {
  isAuth: PropTypes.bool,
  children: PropTypes.node,
  isSideMenuOpen: PropTypes.bool.isRequired,
  toggleSideMenu: PropTypes.func.isRequired,
};

export default Layout;
