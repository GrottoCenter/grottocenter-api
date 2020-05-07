import React from 'react';
import { storiesOf } from '@storybook/react';
import { Typography } from '@material-ui/core';
import PersonIcon from '@material-ui/icons/Person';
import styled from 'styled-components';

import CustomIcon from './index';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
`;

const WithState = () => (
  <Wrapper>
    <div>
      <Typography>Large</Typography>
      <PersonIcon color="primary" fontSize="large" />
      <CustomIcon type="entry" />
      <CustomIcon type="depth" />
      <CustomIcon type="length" />
    </div>
    <div>
      <Typography>Default</Typography>
      <PersonIcon color="primary" />
      <CustomIcon type="entry" size={24} />
      <CustomIcon type="depth" size={24} />
      <CustomIcon type="length" size={24} />
    </div>
    <div>
      <Typography>Small</Typography>
      <PersonIcon color="primary" fontSize="small" />
      <CustomIcon type="entry" size={20} />
      <CustomIcon type="depth" size={20} />
      <CustomIcon type="length" size={20} />
    </div>
  </Wrapper>
);

storiesOf('CustomIcon', module).add('Default', () => <WithState />);
