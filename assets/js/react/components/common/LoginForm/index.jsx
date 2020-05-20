import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import {
  Button,
  FormControl,
  InputLabel,
  FilledInput,
  InputAdornment,
  IconButton,
  CircularProgress,
  Typography,
  Fade,
} from '@material-ui/core';

import Visibility from '@material-ui/icons/Visibility';
import VisibilityOff from '@material-ui/icons/VisibilityOff';
import styled from 'styled-components';

import Translate from '../Translate';

const FormWrapper = styled.form`
  display: flex;
  flex-direction: column;
  margin-bottom: 0;
`;

const LoginButton = styled(Button)`
  display: block;
  margin: auto;
`;

const CircularProgressCentered = styled(CircularProgress)`
  display: block;
  margin: auto;
`;

const ErrorText = styled(Typography)`
  ${({ theme }) => `
  background-color: ${theme.palette.errorColor};
  border-radius: 3px;
  color: ${theme.palette.common.white};
  padding: 0.5rem;
  `}
`;

const LoginForm = ({
  email,
  onEmailChange,
  password,
  onPasswordChange,
  onLogin,
  isFetching,
  authError,
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);

  const toggleIsPasswordVisible = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };
  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const handleEmailChange = (event) => {
    onEmailChange(event.target.value);
  };
  const handlePasswordChange = (event) => {
    onPasswordChange(event.target.value);
  };

  return (
    <>
      <FormWrapper onSubmit={onLogin}>
        <FormControl variant="filled">
          <InputLabel htmlFor="input-with-icon-adornment">
            <FormattedMessage id="Email" />
          </InputLabel>
          <FilledInput
            name="email"
            value={email}
            onChange={handleEmailChange}
            required
          />
        </FormControl>

        <FormControl variant="filled">
          <InputLabel htmlFor="filled-adornment-password">
            <FormattedMessage id="Password" />
          </InputLabel>
          <FilledInput
            name="password"
            type={isPasswordVisible ? 'text' : 'password'}
            value={password}
            onChange={handlePasswordChange}
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
            required
          />
        </FormControl>

        {authError !== '' && (
          <FormControl>
            <Fade in={authError !== ''}>
              <ErrorText>
                <Translate>{authError}</Translate>
              </ErrorText>
            </Fade>
          </FormControl>
        )}

        <FormControl>
          {isFetching ? (
            <CircularProgressCentered />
          ) : (
            <LoginButton type="submit" variant="contained" size="large">
              <Translate>Log in</Translate>
            </LoginButton>
          )}
        </FormControl>
      </FormWrapper>
    </>
  );
};

LoginForm.propTypes = {
  authError: PropTypes.string.isRequired,
  email: PropTypes.string.isRequired,
  onEmailChange: PropTypes.func.isRequired,
  password: PropTypes.string.isRequired,
  onPasswordChange: PropTypes.func.isRequired,
  onLogin: PropTypes.func.isRequired,
  isFetching: PropTypes.bool.isRequired,
};

export default LoginForm;
