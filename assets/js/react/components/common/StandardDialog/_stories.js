import * as React from 'react';
import styled from 'styled-components';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import SendIcon from '@material-ui/icons/Send';
import { Button } from '@material-ui/core';
import StandardDialog from './index';

const Content = styled.div`
  background-color: #4caf50;
  height: 400px;
  width: 500px;
`;
storiesOf('Standard dialog', module).add('Default', () => (
  <StandardDialog
    maxWidth="lg"
    buttonType="button"
    open
    onClose={action('onClose')}
    title="title"
    actions={[
      <Button key={0} onClick={action('Action')} color="primary">
        <>
          <SendIcon color="inherit" />
          Action
        </>
      </Button>,
    ]}
  >
    <Content />
  </StandardDialog>
));
