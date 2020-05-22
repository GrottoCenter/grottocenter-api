import React from 'react';
import { storiesOf } from '@storybook/react';
import PropTypes from 'prop-types';

import AppBar from './index';
import AutoCompleteSearch from '../AutoCompleteSearch';

const WithState = ({ isAuth = null }) => {
  const [isSideMenuOpen, setToggleSideMenu] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loginOpen, setLoginOpen] = React.useState(false);
  const [isLoginFetching, setIsLoginFetching] = React.useState(false);

  const toggleSideMenu = () => {
    setToggleSideMenu(!isSideMenuOpen);
  };

  const getOptionLabel = (option) => option.name;

  const AppBarManager = {
    onLoginClick: () => setLoginOpen(true),
    onLogoutClick: () => window.alert('click log out'), // eslint-disable-line no-alert
    isAuth,
    toggleMenu: toggleSideMenu,
  };

  const LoginManager = {
    onLogin: (e) => {
      e.preventDefault();
      setIsLoginFetching(true);
    },
    email,
    onEmailChange: (e) => setEmail(e.target.value),
    password,
    onPasswordChange: (e) => setPassword(e.target.value),
    isFetching: isLoginFetching,
    open: loginOpen,
    onClose: () => {
      setLoginOpen(false);
      setIsLoginFetching(false);
    },
    title: <h2>Log in</h2>,
    actions: [],
  };

  return (
    <>
      <AppBar
        AppBarManager={AppBarManager}
        AutoCompleteSearch={() => (
          <AutoCompleteSearch
            hasFixWidth={false}
            onSelection={() => {}}
            input=""
            inputValue=""
            onInputChange={() => {}}
            suggestions={[]}
            renderOption={() => {}}
            getOptionLabel={getOptionLabel}
          />
        )}
        LoginManager={LoginManager}
      />
    </>
  );
};

WithState.propTypes = {
  // eslint-disable-next-line react/require-default-props
  isAuth: PropTypes.bool,
};

storiesOf('AppBar', module)
  .add('Logged', () => <WithState isAuth />)
  .add('Not logged', () => <WithState isAuth={false} />);
