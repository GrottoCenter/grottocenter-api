import React from 'react';
import { storiesOf } from '@storybook/react';
import { Card as MuiCard } from '@material-ui/core';
import styled from 'styled-components';
import { boolean, select } from '@storybook/addon-knobs';
import * as d3 from 'd3';

import MultipleMarkers from './MapMultipleMarkers';
import Clusters from './MapClusters';

const Card = styled(MuiCard)`
  margin: ${({ theme }) => theme.spacing(2)}px;
`;

const positions = {
  none: [],
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

const center = [46, 2];
const latFn = d3.randomNormal(center[0], 1);
const longFn = d3.randomNormal(center[1], 1);
const generateRandomCoord = function(intensity = 1000) {
  const data = [];
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < intensity; i++) {
    data.push([longFn(), latFn()]);
  }
  return data;
};

const ClustersMap = () => {
  const entrances = generateRandomCoord(3000);
  const entrancesMarkers = entrances.map((entrance, i) => ({
    latitude: entrance[1],
    longitude: entrance[0],
    id: i,
    name: 'name',
    city: 'city',
    region: 'region',
  }));
  const networks = generateRandomCoord();
  const networkMarkers = networks.map((network, i) => ({
    latitude: network[1],
    longitude: network[0],
    id: i,
  }));
  const organizations = generateRandomCoord(300).map((org, i) => ({
    latitude: org[1],
    longitude: org[0],
    id: i,
  }));
  return (
    <Clusters
      center={center}
      zoom={7}
      entrances={entrances}
      entranceMarkers={entrancesMarkers}
      networks={networks}
      networkMarkers={networkMarkers}
      organizations={organizations}
      onUpdate={() => {}}
    />
  );
};

storiesOf('Maps', module)
  .add('Main with heatmap', () => <ClustersMap />)
  .add('Multiple markers', () => (
    <MultipleMarkersMap
      loading={boolean('Loading', false)}
      selection={select('Entrance markers', positions, [[43.35266, 5.81689]])}
    />
  ));
