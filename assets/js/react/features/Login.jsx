import React from 'react';
import { Button, CircularProgress } from '@material-ui/core';
import { useDispatch, useSelector } from 'react-redux';
import { isEmpty, match } from 'ramda';
import {
  hideLoginDialog,
  postLogin,
  setAuthErrorMessages,
} from '../actions/Auth';
import Translate from '../components/common/Translate';
import StandardDialog from '../components/common/StandardDialog';
import LoginForm from '../components/common/LoginForm';

// ===========================

const isEmailValid = (email) => {
  const emailRegexp = /\S+@\S+/; // simple regexp: it's enough for a login.
  return !isEmpty(match(emailRegexp, email));
};

const Login = () => {
  const dispatch = useDispatch();
  const authState = useSelector((state) => state.auth);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  const onLogin = (event) => {
    event.preventDefault();

    const authErrorMessages = [
      ...(isEmpty(email) ? ['You must provide an email.'] : []),
      ...(!isEmailValid(email) && !isEmpty(email)
        ? ['You must provide a valid email.']
        : []),
      ...(isEmpty(password) ? ['You must provide a password.'] : []),
    ];

    if (authErrorMessages.length > 0) {
      dispatch(setAuthErrorMessages(authErrorMessages));
    } else {
      dispatch(postLogin(email, password));
    }
  };

  const LoginButton = (
    <Button
      key={0}
      type="submit"
      size="large"
      onClick={onLogin}
      color={authState.isFetching ? 'default' : 'primary'}
    >
      {authState.isFetching ? (
        <CircularProgress size="2.8rem" />
      ) : (
        <Translate>Log in</Translate>
      )}
    </Button>
  );

  return (
    <StandardDialog
      open={authState.isLoginDialogDisplayed}
      onClose={() => dispatch(hideLoginDialog())}
      title={<Translate>Log in</Translate>}
      actions={[LoginButton]}
    >
      <LoginForm
        authErrors={authState.errorMessages}
        email={email}
        isFetching={authState.isFetching}
        onEmailChange={setEmail}
        onLogin={onLogin}
        onPasswordChange={setPassword}
        password={password}
      />
    </StandardDialog>
  );
};

Login.propTypes = {};

export default Login;
