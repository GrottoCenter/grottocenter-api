import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import {
  FormControl,
  InputLabel,
  FilledInput,
  InputAdornment,
  IconButton,
  Fade,
} from '@material-ui/core';

import Visibility from '@material-ui/icons/Visibility';
import VisibilityOff from '@material-ui/icons/VisibilityOff';
import styled from 'styled-components';

import ErrorMessage from '../StatusMessage/ErrorMessage';

const FormWrapper = styled.form`
  display: flex;
  flex-direction: column;
  margin-bottom: 0;
`;

const LoginForm = ({
  email,
  onEmailChange,
  password,
  onPasswordChange,
  authErrors,
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);
  const { formatMessage } = useIntl();

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
      <FormWrapper>
        <FormControl variant="filled">
          <InputLabel htmlFor="input-with-icon-adornment">
            {formatMessage({ id: 'Email' })}
          </InputLabel>
          <FilledInput
            name="email"
            value={email}
            onChange={handleEmailChange}
            required
            type="email"
          />
        </FormControl>

        <FormControl variant="filled">
          <InputLabel htmlFor="filled-adornment-password">
            {formatMessage({ id: 'Password' })}
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

        {authErrors.length > 0 && (
          <FormControl>
            {authErrors.map((error) => (
              <Fade in={authErrors.length > 0} key={error}>
                <ErrorMessage message={formatMessage({ id: error })} />
              </Fade>
            ))}
          </FormControl>
        )}
      </FormWrapper>
    </>
  );
};

LoginForm.propTypes = {
  authErrors: PropTypes.arrayOf(PropTypes.string).isRequired,
  email: PropTypes.string.isRequired,
  onEmailChange: PropTypes.func.isRequired,
  password: PropTypes.string.isRequired,
  onPasswordChange: PropTypes.func.isRequired,
};

export default LoginForm;
