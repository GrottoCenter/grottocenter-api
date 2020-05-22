import React from 'react';
import { storiesOf } from '@storybook/react';
import PropTypes from 'prop-types';

import AppBar from './index';
import AutoCompleteSearch from '../AutoCompleteSearch';

const WithState = ({ isAuth = null }) => {
  const [isSideMenuOpen, setToggleSideMenu] = React.useState(false);

  const toggleSideMenu = () => {
    setToggleSideMenu(!isSideMenuOpen);
  };

  return (
    <>
      <AppBar
        toggleMenu={toggleSideMenu}
        isAuth={isAuth}
        onLoginClick={() => window.alert('click login')}
        onLogoutClick={() => window.alert('click logout')}
        AutoCompleteSearch={() => (
          <AutoCompleteSearch
            hasFixWidth={false}
            onSelection={() => {}}
            input=""
            inputValue=""
            onInputChange={() => {}}
            suggestions={[]}
            renderOption={() => {}}
          />
        )}
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
