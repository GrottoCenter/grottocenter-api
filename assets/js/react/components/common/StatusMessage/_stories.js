import * as React from 'react';
import { storiesOf } from '@storybook/react';
import SuccessMessage from './SuccessMessage';
import ErrorMessage from './ErrorMessage';

storiesOf('Status messages', module)
  .add('Success', () => <SuccessMessage message="This is a success message!" />)
  .add('Error', () => <ErrorMessage message="This is an error..." />);
