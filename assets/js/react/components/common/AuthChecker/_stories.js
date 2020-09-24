import React from 'react';
import { storiesOf } from '@storybook/react';
import { Button, Paper } from '@material-ui/core';
import { createStore } from 'redux';
import { Provider, useDispatch } from 'react-redux';
import GCReducer from '../../../reducers/GCReducer';

import { fetchLoginSuccess, logout } from '../../../actions/Auth';
import AuthChecker from './index';

// ==========
const store = createStore(GCReducer);

const FakeAuthControls = () => {
  const dispatch = useDispatch();
  return (
    <Paper
      style={{ margin: '2rem', padding: '2rem', width: '300px' }}
      align="center"
    >
      <h1>Story controls</h1>
      <Button onClick={() => dispatch(fetchLoginSuccess({}, 'fakeAuthTok3n'))}>
        Fake log in
      </Button>
      <Button onClick={() => dispatch(logout())}>Fake log out</Button>
    </Paper>
  );
};

storiesOf('AuthChecker', module)
  .add('Default error component', () => (
    <Provider store={store}>
      <FakeAuthControls />
      <Paper style={{ margin: '2rem', padding: '2rem', width: '400px' }}>
        <AuthChecker
          componentToDisplay={
            <div>
              <h1>The user is authenticated!</h1>
            </div>
          }
        />
      </Paper>
    </Provider>
  ))
  .add('Custom error component', () => (
    <Provider store={store}>
      <FakeAuthControls />
      <Paper style={{ margin: '2rem', padding: '2rem', width: '400px' }}>
        <AuthChecker
          componentToDisplay={
            <div>
              <h1>The user is authenticated!</h1>
            </div>
          }
          errorMessageComponent={
            <div>
              <h1>This is a custom error</h1>
              <p>You should be authenticated to do this.</p>
            </div>
          }
        />
      </Paper>
    </Provider>
  ));
