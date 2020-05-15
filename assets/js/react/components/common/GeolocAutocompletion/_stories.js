import * as React from 'react';
import styled from 'styled-components';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import SendIcon from '@material-ui/icons/Send';
import { Button } from '@material-ui/core';
import Example from './index';

const Content = styled.div`
  background-color: #4caf50;
  height: 400px;
  width: 500px;
`;

storiesOf('Exemple autocomplete geoloc', module).add('Default', () => (
  <Example />
));
