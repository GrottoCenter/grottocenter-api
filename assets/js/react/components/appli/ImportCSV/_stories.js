import React from 'react';
import { storiesOf } from '@storybook/react';
import HydratedImportContainer from './ImportContainer';

storiesOf('ImportCSV', module).add('ImportView', () => (
  <HydratedImportContainer />
));
