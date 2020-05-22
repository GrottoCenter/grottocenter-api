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
import LoginForm from './index';

const DefaultLoginForm = () => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  const onLogin = (e) => {
    e.preventDefault();
    window.alert('form submitted');
  };
  return (
    <LoginForm
      email={email}
      onEmailChange={setEmail}
      password={password}
      onPasswordChange={setPassword}
      onLogin={onLogin}
    />
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

const DialogLoginForm = ({ isOpen = true, authError = '' }) => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  return (
    <>
      <StandardDialog
        buttonType="button"
        open={isOpen}
        onClose={action('onClose')}
        title={<Title />}
        actions={[
          <Button
            type="submit"
            size="large"
            onClick={action('onLogin')}
            color={isLoading ? '' : 'primary'}
            key={0}
          >
            {isLoading ? (
              <CircularProgress size="2.8rem" />
            ) : (
              <Translate>Log in</Translate>
            )}
          </Button>,
        ]}
      >
        <StoryControlsWrapper>
          <div>
            <b>Form State StoryControls</b>
          </div>
          <Switch
            checked={isLoading}
            onChange={(event) => setIsLoading(event.target.checked)}
            color="primary"
            inputProps={{ 'aria-label': 'primary checkbox' }}
          />
          <span>Is loading</span>

  const onLogin = (e) => {
    e.preventDefault();
    window.alert('form submitted');
  };

  const ClearButton = () => (
    <Button
      disabled={email === '' && password === ''}
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
      disabled={email === '' || password === ''}
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
      open={isOpen}
      onClose={action('onClose')}
      title={<Title />}
      actions={[<ClearButton />, <LoginButton />]}
    >
      <LoginForm
        email={email}
        onEmailChange={setEmail}
        password={password}
        onPasswordChange={setPassword}
        onLogin={onLogin}
        authError={authError}
      />
    </StandardDialog>
  );
};

DialogLoginForm.propTypes = {
  isOpen: PropTypes.bool,
  authError: PropTypes.string,
};

storiesOf('Login', module)
  .add('Default', () => <DefaultLoginForm />)
  .add('In Dialog', () => <DialogLoginForm />)
  .add('In Dialog, with error', () => (
    <DialogLoginForm authError="Invalid email or password." />
  ));
