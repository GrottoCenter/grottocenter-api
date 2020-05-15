import React from 'react';
import { storiesOf } from '@storybook/react';
import { Card as MuiCard } from '@material-ui/core';
import styled from 'styled-components';
import { boolean, select } from '@storybook/addon-knobs';

import MultipleMarkers from './MultipleMarkers';

const Card = styled(MuiCard)`
  margin: ${({ theme }) => theme.spacing(2)}px;
`;

const positions = {
  '1 marker': [[43.35266, 5.81689]],
  'multiple markers 1': [
    [43.35266, 5.81689],
    [43.34166, 5.86689],
  ],
  'multiple markers 2': [
    [43.35266, 5.81689],
    [43.34166, 5.86689],
    [43.44166, 5.76689],
  ],
  'multiple markers far distance': [
    [43.35266, 5.81689],
    [43.34166, 5.86689],
    [43.44166, 5.76689],
    [43.0, 6.5],
  ],
};

// eslint-disable-next-line react/prop-types
const MultipleMarkersMap = ({ loading, selection }) => {
  return (
    <Card style={{ width: '500px' }}>
      <MultipleMarkers positions={selection} loading={loading} />
    </Card>
  );
};

storiesOf('Maps', module)
  // .add('Single point', () => (
  //   <MapWithState loading={boolean('Loading', false)} />
  // ))
  .add('Multiple markers', () => (
    <MultipleMarkersMap
      loading={boolean('Loading', false)}
      selection={select('Entry markers', positions, [[43.35266, 5.81689]])}
    />
  ));
