import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { useHistory } from 'react-router-dom';
import {
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  Typography,
} from '@material-ui/core';
import Visibility from '@material-ui/icons/Visibility';
import VisibilityOff from '@material-ui/icons/VisibilityOff';
import styled from 'styled-components';
import { isEmpty, match } from 'ramda';

import { emailRegexp, PASSWORD_MIN_LENGTH } from '../../conf/Config';
import Layout from '../../components/common/Layouts/Fixed/FixedContent';
import StringInput from '../../components/common/Form/StringInput';

const FormWrapper = styled.form`
  display: flex;
  flex-direction: column;
  margin: auto;
  margin-bottom: 0;
  max-width: 500px;
`;

const SpacedCenteredButton = styled(Button)`
  margin: ${({ theme }) => theme.spacing(1)}px auto;
`;

const SignUpForm = ({
  email,
  name,
  nickname,
  password,
  passwordConfirmation,
  surname,
  onEmailChange,
  onNameChange,
  onNicknameChange,
  onPasswordChange,
  onPasswordConfirmationChange,
  onSignUp,
  onSurnameChange,
  loading,
  signUpRequestSucceeded,
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);
  const { formatMessage } = useIntl();
  const history = useHistory();

  const toggleIsPasswordVisible = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };
  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const checkIfHasError = (fieldName) => {
    switch (fieldName) {
      case 'email':
        return isEmpty(match(emailRegexp, email));
      case 'password':
      case 'passwordConfirmation':
        return (
          password < PASSWORD_MIN_LENGTH || password !== passwordConfirmation
        );

      default:
        return false;
    }
  };

  return (
    <Layout
      title={formatMessage({ id: 'Join Grottocenter' })}
      footer=""
      content={
        <>
          {signUpRequestSucceeded ? (
            <>
              <Typography align="center">
                {formatMessage({
                  id: 'Your account has been successfully created!',
                })}{' '}
                {formatMessage({
                  id:
                    'You can now log in to Grottocenter using the email and password you entered.',
                })}
              </Typography>
              <SpacedCenteredButton
                color="primary"
                onClick={() => history.push('/ui/login')}
                style={{ display: 'block' }}
                variant="contained"
              >
                {formatMessage({ id: 'Log in' })}
              </SpacedCenteredButton>
            </>
          ) : (
            <FormWrapper onSubmit={onSignUp}>
              <StringInput
                fullWidth
                helperText={formatMessage({
                  id: 'The nickname defines how other users see you.',
                })}
                onValueChange={onNicknameChange}
                required
                value={nickname}
                valueName={formatMessage({ id: 'Nickname' })}
              />
              <StringInput
                fullWidth
                helperText={formatMessage({
                  id: 'Your real name (optional).',
                })}
                onValueChange={onNameChange}
                value={name}
                valueName={formatMessage({ id: 'Caver.Name' })}
              />
              <StringInput
                fullWidth
                helperText={formatMessage({
                  id: 'Your real surname (optional).',
                })}
                onValueChange={onSurnameChange}
                value={surname}
                valueName={formatMessage({ id: 'Surname' })}
              />

              <StringInput
                fullWidth
                hasError={checkIfHasError('email')}
                onValueChange={onEmailChange}
                required
                value={email}
                valueName={formatMessage({ id: 'Email' })}
              />

              <StringInput
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={toggleIsPasswordVisible}
                      onMouseDown={handleMouseDownPassword}
                      edge="end"
                    >
                      {isPasswordVisible ? <Visibility /> : <VisibilityOff />}
                    </IconButton>
                  </InputAdornment>
                }
                fullWidth
                hasError={checkIfHasError('password')}
                helperText={formatMessage(
                  {
                    id: `signUp.password.length.error`,
                    defaultMessage: `Your password must be at least {passwordMinLength} characters.`,
                    description:
                      'Error displayed when the account password is too short.',
                  },
                  {
                    passwordMinLength: PASSWORD_MIN_LENGTH,
                  },
                )}
                onValueChange={onPasswordChange}
                required
                type={isPasswordVisible ? 'text' : 'password'}
                value={password}
                valueName={formatMessage({ id: 'Password' })}
              />

              <StringInput
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={toggleIsPasswordVisible}
                      onMouseDown={handleMouseDownPassword}
                      edge="end"
                    >
                      {isPasswordVisible ? <Visibility /> : <VisibilityOff />}
                    </IconButton>
                  </InputAdornment>
                }
                hasError={checkIfHasError('passwordConfirmation')}
                helperText="Repeat your password here."
                fullWidth
                onValueChange={onPasswordConfirmationChange}
                required
                type={isPasswordVisible ? 'text' : 'password'}
                value={passwordConfirmation}
                valueName={formatMessage({ id: 'Password confirmation' })}
              />
              <SpacedCenteredButton
                type="submit"
                size="large"
                color={loading ? 'default' : 'primary'}
              >
                {loading ? (
                  <CircularProgress size="2.8rem" />
                ) : (
                  formatMessage({ id: 'Sign up' })
                )}
              </SpacedCenteredButton>
            </FormWrapper>
          )}
        </>
      }
    />
  );
};

SignUpForm.propTypes = {
  email: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  nickname: PropTypes.string.isRequired,
  password: PropTypes.string.isRequired,
  passwordConfirmation: PropTypes.string.isRequired,
  surname: PropTypes.string.isRequired,
  onEmailChange: PropTypes.func.isRequired,
  onSignUp: PropTypes.func.isRequired,
  onNameChange: PropTypes.func.isRequired,
  onNicknameChange: PropTypes.func.isRequired,
  onPasswordChange: PropTypes.func.isRequired,
  onPasswordConfirmationChange: PropTypes.func.isRequired,
  onSurnameChange: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  signUpRequestSucceeded: PropTypes.bool.isRequired,
};

export default SignUpForm;
