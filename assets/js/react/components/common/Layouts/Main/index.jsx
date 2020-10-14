import React from 'react';
import { isMobileOnly } from 'react-device-detect';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import ErrorBoundary from 'react-error-boundary';

import SideMenu from '../../SideMenu';
import Breadcrump from '../../../appli/Breadcrump';

const MainWrapper = styled.main`
  flex-grow: 1;
  transition: ${({ theme, isSideMenuOpen }) =>
    !isMobileOnly &&
    theme.transitions.create('margin', {
      easing: isSideMenuOpen
        ? theme.transitions.easing.easeOut
        : theme.transitions.easing.sharp,
      duration: isSideMenuOpen
        ? theme.transitions.duration.enteringScreen
        : theme.transitions.duration.leavingScreen,
    })};
  margin-left: ${({ theme, isSideMenuOpen }) =>
    !isMobileOnly && (isSideMenuOpen ? theme.sideMenuWidth : 0)}px;
`;

const Layout = ({
  children,
  isAuth = false,
  isSideMenuOpen,
  toggleSideMenu,
  SideBarQuickSearch,
  AppBar,
}) => (
  <>
    <AppBar toggleSideMenu={toggleSideMenu} isSideMenuOpen={isSideMenuOpen} />
    <SideMenu
      isAuth={isAuth}
      isOpen={isSideMenuOpen}
      toggle={toggleSideMenu}
      AutoCompleteSearch={SideBarQuickSearch}
    />
    <MainWrapper isSideMenuOpen={isSideMenuOpen}>
      <Breadcrump />
      <ErrorBoundary>{children}</ErrorBoundary>
    </MainWrapper>
  </>
);

Layout.propTypes = {
  AppBar: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.element,
    PropTypes.func,
  ]).isRequired,
  children: PropTypes.node,
  isAuth: PropTypes.bool,
  isSideMenuOpen: PropTypes.bool.isRequired,
  toggleSideMenu: PropTypes.func.isRequired,
  SideBarQuickSearch: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.element,
    PropTypes.func,
  ]).isRequired,
};

export default Layout;
