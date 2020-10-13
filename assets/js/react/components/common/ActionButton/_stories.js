import React from 'react';
import { storiesOf } from '@storybook/react';
import { boolean, select } from '@storybook/addon-knobs';

import ActionButton from './index';

const colors = { Primary: 'primary', Secondary: 'secondary' };

storiesOf('ActionButton', module).add('default', () => (
  <ActionButton
    label="Action button"
    onClick={() => {}}
    disabled={boolean('Disabled', false)}
    loading={boolean('Loading', false)}
    color={select('Color', colors, 'primary')}
  />
));
