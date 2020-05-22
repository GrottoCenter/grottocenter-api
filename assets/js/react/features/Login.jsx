import React from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { hideLoginDialog, postLogin } from '../actions/Auth';
import StandardDialog from '../components/common/StandardDialog';
import LoginForm from '../components/common/LoginForm';
import Translate from '../components/common/Translate';

// ===========================

const isEmailValid = (email) => {
  const emailRegexp = /\S+@\S+/; // simple regexp: it's enough for a login.
  return !isEmpty(match(emailRegexp, email));
};

const Login = () => {
  const [formValues, setValues] = React.useState({ email: '', password: '' });
  const authState = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setValues({ ...formValues, [name]: value });
  };

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
      color={authState.isFetching ? '' : 'primary'}
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
      actions={[]}
    >
      <LoginForm
        onLogin={onLogin}
        email={formValues.email}
        onEmailChange={handleInputChange}
        password={formValues.password}
        onPasswordChange={handleInputChange}
        isFetching={authState.isFetching}
      />
    </StandardDialog>
  );
};

Login.propTypes = {};

export default Login;
