import React from 'react';
import PropTypes from 'prop-types';
import { Fade } from '@material-ui/core';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';

import {
  displayLoginDialog,
  hideLoginDialog,
  postLogout,
  postLogin,
} from '../actions/Auth';
import AppBar from '../components/common/AppBar';
import Translate from '../components/common/Translate';
import isAuth from '../helpers/AuthHelper';

// eslint-disable-next-line react/prop-types
const HeaderAutoCompleteSearch = ({ isSideMenuOpen, HeaderQuickSearch }) => (
  <Fade in={!isSideMenuOpen}>
    <div>
      <HeaderQuickSearch />
    </div>
  </Fade>
);

const AppBarProvider = ({
  toggleSideMenu,
  isSideMenuOpen,
  HeaderQuickSearch,
}) => {
  const dispatch = useDispatch();
  const authState = useSelector((state) => state.auth);
  const history = useHistory();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  const onLogin = (event) => {
    event.preventDefault();
    dispatch(postLogin(email, password));
  };

  const onLoginClick = () =>
    authState.isLoginDialogDisplayed
      ? dispatch(hideLoginDialog())
      : dispatch(displayLoginDialog());

  const onLogoutClick = () => {
    dispatch(postLogout());
    history.push('/');
  };

  const appBarManager = {
    toggleMenu: toggleSideMenu,
    isAuth: isAuth(),
    onLoginClick,
    onLogoutClick,
  };

  const loginManager = {
    onLogin: (e) => onLogin(e),
    email,
    onEmailChange: setEmail,
    password,
    onPasswordChange: setPassword,
    isFetching: authState.isFetching,
    open: authState.isLoginDialogDisplayed,
    onClose: () => dispatch(hideLoginDialog()),
    title: <Translate>Log in</Translate>,
    actions: [],
    authError: authState.errorMessage,
  };

  return (
    <AppBar
      AppBarManager={appBarManager}
      LoginManager={loginManager}
      AutoCompleteSearch={() => (
        <HeaderAutoCompleteSearch
          isSideMenuOpen={isSideMenuOpen}
          HeaderQuickSearch={HeaderQuickSearch}
        />
      )}
    />
  );
};

AppBarProvider.propTypes = {
  isSideMenuOpen: PropTypes.bool.isRequired,
  toggleSideMenu: PropTypes.func.isRequired,
  HeaderQuickSearch: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.element,
    PropTypes.func,
  ]).isRequired,
};

export default AppBarProvider;
