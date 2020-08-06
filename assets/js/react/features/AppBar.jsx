import React from 'react';
import PropTypes from 'prop-types';
import { Fade } from '@material-ui/core';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';

import {
  displayLoginDialog,
  hideLoginDialog,
  postLogout,
} from '../actions/Auth';
import AppBarComponent from '../components/common/AppBar';
import isAuth from '../helpers/AuthHelper';

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
  const authState = useSelector((state) => state.auth);
  const history = useHistory();

  const onLoginClick = () =>
    authState.isLoginDialogDisplayed
      ? dispatch(hideLoginDialog())
      : dispatch(displayLoginDialog());

  const onLogoutClick = () => {
    dispatch(postLogout());
    history.go(); // refresh the current page
  };

  return (
    <AppBarComponent
      toggleMenu={toggleSideMenu}
      isAuth={isAuth()}
      onLoginClick={onLoginClick}
      onLogoutClick={onLogoutClick}
      AutoCompleteSearch={() => (
        <HeaderAutoCompleteSearch
          isSideMenuOpen={isSideMenuOpen}
          HeaderQuickSearch={HeaderQuickSearch}
        />
      )}
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
