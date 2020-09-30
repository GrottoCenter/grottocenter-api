import React from 'react';
import { storiesOf } from '@storybook/react';
import { Button, Paper, Typography } from '@material-ui/core';
import { createStore } from 'redux';
import { Provider, useDispatch } from 'react-redux';
import GCReducer from '../../reducers/GCReducer';

import { fetchLoginSuccess, logout } from '../../actions/Auth';
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
      <Typography variant="h2">Story controls</Typography>
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
              <Typography variant="h2">
                The user is authenticated so I am displayed!
              </Typography>
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
              <Typography variant="h2">
                The user is authenticated so I am displayed!
              </Typography>
            </div>
          }
          errorMessageComponent={
            <div>
              <Typography variant="h2">This is a custom error</Typography>
              <Typography variant="body1">
                You should be authenticated to do this.
              </Typography>
            </div>
          }
        />
      </Paper>
    </Provider>
  ));
