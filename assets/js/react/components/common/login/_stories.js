import React from 'react';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { Button, Divider } from '@material-ui/core';
import SendIcon from '@material-ui/icons/Send';
import ClearIcon from '@material-ui/icons/Clear';
import FaceIcon from '@material-ui/icons/Face';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';
import PropTypes from 'prop-types';

import StandardDialog from '../StandardDialog';
import Login from './index';

const Default = () => {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');

  return (
    <>
      <Login
        username={username}
        onUsernameChange={setUsername}
        password={password}
        onPasswordChange={setPassword}
      />
    </>
  );
};

const TitleWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StyledDivider = styled(Divider)`
  flex-grow: 1;
`;

const Title = () => (
  <TitleWrapper>
    <StyledDivider color="primary" />
    <FaceIcon color="primary" />
    <StyledDivider />
  </TitleWrapper>
);

// eslint-disable-next-line import/prefer-default-export
const Advanced = ({ open = true }) => {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');

  const handleReset = () => {
    setUsername('');
    setPassword('');
  };

  const ClearButton = () => (
    <Button
      disabled={username === '' && password === ''}
      key={0}
      onClick={handleReset}
      color="primary"
    >
      <>
        <ClearIcon color="inherit" />
        <FormattedMessage id="Clear" />
      </>
    </Button>
  );

  const LoginButton = () => (
    <Button
      disabled={username === '' || password === ''}
      key={1}
      onClick={handleReset}
      color="primary"
    >
      <>
        <SendIcon color="inherit" />
        <FormattedMessage id="Login" />
      </>
    </Button>
  );

  return (
    <StandardDialog
      buttonType="button"
      open={open}
      onClose={action('onClose')}
      title={<Title />}
      actions={[<ClearButton />, <LoginButton />]}
    >
      <Login
        username={username}
        onUsernameChange={setUsername}
        password={password}
        onPasswordChange={setPassword}
      />
    </StandardDialog>
  );
};

Advanced.propTypes = {
  open: PropTypes.bool,
};

storiesOf('Login', module)
  .add('Default', () => <Default />)
  .add('Advanced', () => <Advanced />);
