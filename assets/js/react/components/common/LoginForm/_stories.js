import React from 'react';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { Divider } from '@material-ui/core';
import FaceIcon from '@material-ui/icons/Face';
import styled from 'styled-components';
import PropTypes from 'prop-types';

import StandardDialog from '../StandardDialog';
import LoginForm from './index';

const DefaultLoginForm = () => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  const onLogin = (e) => {
    e.preventDefault();
    window.alert('form submitted'); // eslint-disable-line no-alert
  };
  return (
    <LoginForm
      email={email}
      onEmailChange={setEmail}
      password={password}
      onPasswordChange={setPassword}
      onLogin={onLogin}
      authError=""
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

const DialogLoginForm = ({
  isOpen = true,
  authError = '',
  initialEmail = '',
  initialPassword = '',
}) => {
  const [email, setEmail] = React.useState(initialEmail);
  const [password, setPassword] = React.useState(initialPassword);

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
    window.alert('form submitted'); // eslint-disable-line no-alert
  };

  return (
    <StandardDialog
      buttonType="button"
      open={isOpen}
      onClose={action('onClose')}
      title={<Title />}
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
  authError: PropTypes.string,
  initialEmail: PropTypes.string,
  initialPassword: PropTypes.string,
  isOpen: PropTypes.bool,
};

storiesOf('Login', module)
  .add('Default', () => <DefaultLoginForm />)
  .add('In Dialog', () => <DialogLoginForm />)
  .add('In Dialog, with error', () => (
    <DialogLoginForm
      authError="Invalid email or password."
      initialEmail="wrong@email.com"
      initialPassword="wrongPassword"
    />
  ));
