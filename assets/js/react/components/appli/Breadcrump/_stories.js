import React from 'react';
import { storiesOf } from '@storybook/react';
import { MemoryRouter } from 'react-router';

import Breadcrump from './index';

storiesOf('Breadcrump', module)
  .add('Entries', () => (
    <MemoryRouter initialEntries={['ui/entries/42']}>
      <Breadcrump />
    </MemoryRouter>
  ))
  .add('Add document', () => (
    <MemoryRouter initialEntries={['ui/documents/add']}>
      <Breadcrump />
    </MemoryRouter>
  ));
