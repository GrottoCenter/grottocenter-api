import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import {
  FormControl,
  InputLabel,
  FilledInput,
  InputAdornment,
  IconButton,
} from '@material-ui/core';
import Visibility from '@material-ui/icons/Visibility';
import VisibilityOff from '@material-ui/icons/VisibilityOff';
import styled from 'styled-components';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
`;

const Login = ({ username, onUsernameChange, password, onPasswordChange }) => {
  const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);

  const toggleIsPasswordVisible = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };
  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };
  const handleUsernameChange = (event) => {
    onUsernameChange(event.target.value);
  };
  const handlePasswordChange = (event) => {
    onPasswordChange(event.target.value);
  };

  return (
    <Wrapper>
      <FormControl variant="filled">
        <InputLabel htmlFor="input-with-icon-adornment">
          <FormattedMessage id="Username" />
        </InputLabel>
        <FilledInput value={username} onChange={handleUsernameChange} />
      </FormControl>

      <FormControl variant="filled">
        <InputLabel htmlFor="filled-adornment-password">
          <FormattedMessage id="Password" />
        </InputLabel>
        <FilledInput
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
        />
      </FormControl>
    </Wrapper>
  );
};

Login.propTypes = {
  username: PropTypes.string.isRequired,
  onUsernameChange: PropTypes.func.isRequired,
  password: PropTypes.string.isRequired,
  onPasswordChange: PropTypes.func.isRequired,
};

export default Login;
