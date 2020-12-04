import React from 'react';
import PropTypes from 'prop-types';
import { Fade } from '@material-ui/core';
import { useDispatch, useSelector } from 'react-redux';
import { pathOr } from 'ramda';

import {
  displayLoginDialog,
  hideLoginDialog,
  postLogout,
} from '../actions/Login';
import AppBarComponent from '../components/common/AppBar';
import { usePermissions } from '../hooks';

// eslint-disable-next-line react/prop-types
const HeaderAutoCompleteSearch = ({ isSideMenuOpen, HeaderQuickSearch }) => (
  <Fade in={!isSideMenuOpen}>
    <div>
      <HeaderQuickSearch />
    </div>
  </Fade>
);

const AppBar = ({ toggleSideMenu, isSideMenuOpen, HeaderQuickSearch }) => {
  const dispatch = useDispatch();
  const authState = useSelector((state) => state.login);
  const permissions = usePermissions();

  const onLoginClick = () =>
    authState.isLoginDialogDisplayed
      ? dispatch(hideLoginDialog())
      : dispatch(displayLoginDialog());

  const onLogoutClick = () => {
    dispatch(postLogout());
  };

  return (
    <AppBarComponent
      AutoCompleteSearch={() => (
        <HeaderAutoCompleteSearch
          isSideMenuOpen={isSideMenuOpen}
          HeaderQuickSearch={HeaderQuickSearch}
        />
      )}
      isAuth={permissions.isAuth}
      onLoginClick={onLoginClick}
      onLogoutClick={onLogoutClick}
      toggleMenu={toggleSideMenu}
      userNickname={pathOr(null, ['authTokenDecoded', 'nickname'], authState)}
    />
  );
};

AppBar.propTypes = {
  isSideMenuOpen: PropTypes.bool.isRequired,
  toggleSideMenu: PropTypes.func.isRequired,
  HeaderQuickSearch: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.element,
    PropTypes.func,
  ]).isRequired,
};

export default AppBar;
