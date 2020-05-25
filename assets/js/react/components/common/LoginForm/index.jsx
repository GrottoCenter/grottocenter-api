import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import {
  FormControl,
  InputLabel,
  FilledInput,
  InputAdornment,
  IconButton,
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

const ErrorText = styled(Typography)`
  ${({ theme }) => `
  background-color: ${theme.palette.errorColor};
  border-radius: ${theme.shape.borderRadius};
  color: ${theme.palette.common.white};
  margin: ${theme.spacing(0)}px 0;
  padding: ${theme.spacing(2)}px;
  `}
`;

const LoginForm = ({
  email,
  onEmailChange,
  password,
  onPasswordChange,
  authErrors,
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
      <FormWrapper>
        <FormControl variant="filled">
          <InputLabel htmlFor="input-with-icon-adornment">
            <FormattedMessage id="Email" />
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

        {authErrors.length > 0 && (
          <FormControl>
            {authErrors.map((error) => (
              <Fade in={authErrors.length > 0} key={error}>
                <ErrorText>
                  <Translate>{error}</Translate>
                </ErrorText>
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
