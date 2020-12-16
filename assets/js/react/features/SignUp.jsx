import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import { isEmpty, match } from 'ramda';

import { emailRegexp, PASSWORD_MIN_LENGTH } from '../conf/Config';
import { postSignUp } from '../actions/SignUp';
import { useNotification } from '../hooks';
import SignUpForm from '../pages/SignUpForm';

// ===========================

const SignUp = () => {
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  const signUpState = useSelector((state) => state.signUp);
  const [signUpRequestSent, setSignUpRequestSent] = React.useState(false);
  const [signUpRequestSucceeded, setSignUpRequestSucceeded] = React.useState(
    false,
  );
  const [email, setEmail] = React.useState('');
  const [name, setName] = React.useState('');
  const [nickname, setNickname] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [passwordConfirmation, setPasswordConfirmation] = React.useState('');
  const [surname, setSurname] = React.useState('');
  const { onError } = useNotification();

  /**
   * Display error notifications if some values are incorrect.
   * Return true if all values are valid, else false.
   */
  const checkIfValuesAreValid = () => {
    const errors = [];
    if (password !== passwordConfirmation) {
      errors.push(formatMessage({ id: 'The passwords must match.' }));
    }
    if (password.length < PASSWORD_MIN_LENGTH) {
      errors.push(
        formatMessage(
          {
            id: `signUp.password.length.error`,
            defaultMessage: `Your password must be at least {passwordMinLength} characters.`,
            description: 'Error displayed when the password is too short.',
          },
          {
            passwordMinLength: PASSWORD_MIN_LENGTH,
          },
        ),
      );
    }
    if (isEmpty(match(emailRegexp, email))) {
      errors.push(formatMessage({ id: 'The email must be valid.' }));
    }

    if (errors.length > 0) {
      errors.map((e) => onError(e));
      return false;
    }
    return true;
  };

  const onSignUp = (event) => {
    event.preventDefault();
    if (checkIfValuesAreValid()) {
      dispatch(
        postSignUp({
          email,
          name,
          nickname,
          password,
          surname,
        }),
      );
      setSignUpRequestSent(true);
    }
  };

  useEffect(() => {
    if (
      signUpState.error === null &&
      !signUpState.isFetching &&
      signUpRequestSent
    ) {
      setSignUpRequestSucceeded(true);
    } else {
      setSignUpRequestSucceeded(false);
    }
  }, [signUpState, signUpRequestSent]);

  return (
    <SignUpForm
      loading={signUpState.isFetching}
      email={email}
      name={name}
      nickname={nickname}
      password={password}
      passwordConfirmation={passwordConfirmation}
      surname={surname}
      onEmailChange={setEmail}
      onNameChange={setName}
      onNicknameChange={setNickname}
      onPasswordChange={setPassword}
      onPasswordConfirmationChange={setPasswordConfirmation}
      onSurnameChange={setSurname}
      onSignUp={onSignUp}
      signUpRequestSucceeded={signUpRequestSucceeded}
    />
  );
};

SignUp.propTypes = {};

export default SignUp;
