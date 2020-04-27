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
} from '@material-ui/core';
import Visibility from '@material-ui/icons/Visibility';
import VisibilityOff from '@material-ui/icons/VisibilityOff';
import styled from 'styled-components';

import Translate from '../Translate';

const ColumnWrapper = styled.div`
  display: flex;
  flex-direction: column;
  margin: 1rem 20%;
  @media (max-width: 768px) {
    margin: 1rem 1rem;
  }
`;

const LoginButton = styled(Button)`
  display: block;
  margin: auto;
`;

const Login = ({
  username,
  onUsernameChange,
  password,
  onPasswordChange,
  onLogin,
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);

  const toggleIsPasswordVisible = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };
  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  return (
    <>
      <ColumnWrapper>
        <FormControl variant="filled">
          <InputLabel htmlFor="input-with-icon-adornment">
            <FormattedMessage id="Username" />
          </InputLabel>
          <FilledInput value={username} onChange={onUsernameChange} />
        </FormControl>

        <FormControl variant="filled">
          <InputLabel htmlFor="filled-adornment-password">
            <FormattedMessage id="Password" />
          </InputLabel>
          <FilledInput
            type={isPasswordVisible ? 'text' : 'password'}
            value={password}
            onChange={onPasswordChange}
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
          />
        </FormControl>
      </ColumnWrapper>

      <LoginButton
        className
        type="button"
        variant="contained"
        size="large"
        onClick={onLogin}
      >
        <Translate>Login</Translate>
      </LoginButton>
    </>
  );
};

Login.propTypes = {
  username: PropTypes.string.isRequired,
  onUsernameChange: PropTypes.func.isRequired,
  password: PropTypes.string.isRequired,
  onPasswordChange: PropTypes.func.isRequired,
  onLogin: PropTypes.func.isRequired,
};

export default Login;
