import React from 'react';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { Button, CircularProgress, Divider, Switch } from '@material-ui/core';
import FaceIcon from '@material-ui/icons/Face';
import styled from 'styled-components';
import PropTypes from 'prop-types';

import Translate from '../Translate';
import StandardDialog from '../StandardDialog';
import LoginForm from './index';

const DefaultLoginForm = () => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  return (
    <LoginForm
      email={email}
      onEmailChange={setEmail}
      password={password}
      onPasswordChange={setPassword}
      onLogin={action('onLogin')}
      authErrors={[]}
    />
  );
};

const StoryControlsWrapper = styled.div`
  background-color: ${({ theme }) => theme.palette.primary.light};
  font-size: 1.5rem;
  left: 0;
  padding: 0.5rem;
  position: absolute;
  right: 0;
  top: -75px;
`;

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
  authErrors = [],
  initialEmail = '',
  initialPassword = '',
}) => {
  const [email, setEmail] = React.useState(initialEmail);
  const [password, setPassword] = React.useState(initialPassword);
  const [isLoading, setIsLoading] = React.useState(false);
  const [hasErrors, setHasErrors] = React.useState(false);

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

          <Switch
            checked={hasErrors}
            onChange={(event) => setHasErrors(event.target.checked)}
            color="primary"
            inputProps={{ 'aria-label': 'primary checkbox' }}
          />
          <span>Has errors</span>
        </StoryControlsWrapper>

        <LoginForm
          email={email}
          onEmailChange={setEmail}
          password={password}
          onPasswordChange={setPassword}
          authErrors={hasErrors ? authErrors : []}
        />
      </StandardDialog>
    </>
  );
};

DialogLoginForm.propTypes = {
  authErrors: PropTypes.arrayOf(PropTypes.string),
  initialEmail: PropTypes.string,
  initialPassword: PropTypes.string,
  isOpen: PropTypes.bool,
};

storiesOf('Login', module)
  .add('Default', () => <DefaultLoginForm />)
  .add('In Dialog', () => (
    <DialogLoginForm
      authErrors={[
        'You must provide an email.',
        'You must provide a valid email.',
        'You must provide a password.',
      ]}
    />
  ));
