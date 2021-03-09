import React from 'react';
import { storiesOf } from '@storybook/react';
import { FormControlLabel, Paper, Switch, Typography } from '@material-ui/core';
import SignUpForm from './index';

const HydratedSignUpForm = () => {
  const [signUpRequestSucceeded, setSignUpRequestSucceeded] = React.useState(
    false,
  );
  const [loading, setLoading] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [name, setName] = React.useState('');
  const [nickname, setNickname] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [passwordConfirmation, setPasswordConfirmation] = React.useState('');
  const [surname, setSurname] = React.useState('');

  return (
    <>
      <Paper
        style={{ margin: '2rem', padding: '2rem', width: '300px' }}
        align="center"
      >
        <Typography variant="h2">Story controls</Typography>
        <FormControlLabel
          control={
            <Switch
              checked={loading}
              onChange={(event) => setLoading(event.target.checked)}
              name="Loading"
              color="primary"
            />
          }
          label="Loading"
        />
      </Paper>
      <SignUpForm
        email={email}
        name={name}
        nickname={nickname}
        password={password}
        passwordConfirmation={passwordConfirmation}
        surname={surname}
        onEmailChange={setEmail}
        onNameChange={setName}
        onNicknameChange={setNickname}
        onPasswordChange={setPassword}
        onPasswordConfirmationChange={setPasswordConfirmation}
        onSignUp={() => setSignUpRequestSucceeded(true)}
        onSurnameChange={setSurname}
        loading={loading}
        signUpRequestSucceeded={signUpRequestSucceeded}
      />
    </>
  );
};

storiesOf('Sign up form', module).add('Form (without error management)', () => (
  <HydratedSignUpForm />
));
