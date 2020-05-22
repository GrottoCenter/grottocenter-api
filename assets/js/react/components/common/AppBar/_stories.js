import React from 'react';
import PropTypes from 'prop-types';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';

import AppBar from './index';
import AutoCompleteSearch from '../AutoCompleteSearch';
import User from './User';

const AppBarWithState = ({ isAuth }) => {
  const getOptionLabel = (option) => option.name;
  return (
    <>
      <AppBar
        toggleMenu={action('toggle side menu')}
        isAuth={isAuth}
        onLoginClick={action('click log in')}
        onLogoutClick={action('click log out')}
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
      />
    </>
  );
};

AppBarWithState.propTypes = {
  isAuth: PropTypes.bool.isRequired,
};

const UserWithState = ({ isAuth }) => {
  return (
    <User
      isAuth={isAuth}
      onLoginClick={action('onLoginClick')}
      onLogoutClick={action('onLogouClick')}
    />
  );
};

UserWithState.propTypes = {
  isAuth: PropTypes.bool.isRequired,
};

storiesOf('AppBar', module)
  .add('Logged', () => <AppBarWithState isAuth />)
  .add('Not logged', () => <AppBarWithState isAuth={false} />)
  .add('User menu, logged', () => <UserWithState isAuth />)
  .add('User menu, not logged', () => <UserWithState isAuth={false} />);
