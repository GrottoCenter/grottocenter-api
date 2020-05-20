import React from 'react';
import { storiesOf } from '@storybook/react';
import PropTypes from 'prop-types';

import AppBar from './index';
import AutoCompleteSearch from '../AutoCompleteSearch';

const WithState = ({ isAuth }) => {
  const getOptionLabel = (option) => option.name;
  return (
    <>
      <AppBar
        toggleMenu={() => window.alert('toggle side menu')} // eslint-disable-line no-alert
        isAuth={isAuth}
        onLoginClick={() => window.alert('click log in')} // eslint-disable-line no-alert
        onLogoutClick={() => window.alert('click log out')} // eslint-disable-line no-alert
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

WithState.propTypes = {
  isAuth: PropTypes.bool.isRequired,
};

storiesOf('AppBar', module)
  .add('Logged', () => <WithState isAuth />)
  .add('Not logged', () => <WithState isAuth={false} />);
